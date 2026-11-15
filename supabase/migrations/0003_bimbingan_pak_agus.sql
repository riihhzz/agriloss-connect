-- =====================================================================
-- 0003 — Revisi dari bimbingan Pak Agus (12 Nov 2026)
--  • Produk: kategori olahan & buah bahan baku (untuk filter katalog)
--  • Penawaran: harga pasar & perkiraan masa layak (hari)
--  • Transaksi: metode bayar, subtotal, biaya layanan (2%, maks Rp5.000)
--  • Chat in-app Petani ↔ UMKM (pengganti WhatsApp)
-- Semua perubahan bersifat menambah (data lama tetap aman).
-- =====================================================================

-- ---------- Produk ----------
alter table public.products
  add column if not exists category text not null default 'lainnya'
    check (category in ('minuman', 'makanan_ringan', 'selai_olesan', 'kue_roti', 'makanan_beku', 'lainnya')),
  add column if not exists fruit text;
create index if not exists products_category_idx on public.products (category);

-- ---------- Penawaran & transaksi ----------
alter table public.offers
  add column if not exists market_price_per_kg integer check (market_price_per_kg >= 0),
  add column if not exists shelf_life_days integer check (shelf_life_days between 0 and 60),
  add column if not exists payment_method text check (payment_method in ('qris', 'transfer', 'tunai')),
  add column if not exists subtotal integer check (subtotal >= 0),
  add column if not exists service_fee integer check (service_fee >= 0),
  add column if not exists total_paid integer check (total_paid >= 0),
  add column if not exists paid_at timestamptz;

-- Biaya layanan platform: 2% dari subtotal, maksimal Rp5.000 (dibayar UMKM)
create or replace function public.service_fee_for(p_subtotal integer)
returns integer
language sql immutable set search_path = ''
as $$ select least(round(p_subtotal * 0.02)::integer, 5000) $$;

-- complete_offer kini juga mencatat pembayaran.
-- Versi lama (tanpa metode bayar) tidak dihapus, tetapi izin pemanggilannya dicabut
-- agar transaksi tidak bisa diselesaikan tanpa pencatatan pembayaran.
revoke execute on function public.complete_offer(uuid, date) from public, anon, authenticated;
create or replace function public.complete_offer(p_offer_id uuid, p_payment_method text, p_fresh_until date default null)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_offer    public.offers;
  v_petani   text;
  v_subtotal integer;
  v_fee      integer;
begin
  if p_payment_method not in ('qris', 'transfer', 'tunai') then
    raise exception 'Metode pembayaran tidak valid';
  end if;

  select * into v_offer from public.offers
   where id = p_offer_id and status = 'diterima' and accepted_by = auth.uid()
   for update;
  if not found then
    raise exception 'Penawaran tidak dapat diselesaikan';
  end if;

  v_subtotal := round(v_offer.quantity_kg * v_offer.price_per_kg)::integer;
  v_fee := public.service_fee_for(v_subtotal);

  update public.offers
     set status = 'selesai', completed_at = now(), paid_at = now(),
         payment_method = p_payment_method, subtotal = v_subtotal,
         service_fee = v_fee, total_paid = v_subtotal + v_fee
   where id = p_offer_id;

  select full_name into v_petani from public.profiles where id = v_offer.petani_id;

  insert into public.stocks (umkm_id, offer_id, petani_name, fruit_type, quantity_kg, fresh_until)
  values (auth.uid(), v_offer.id, v_petani, v_offer.fruit_type, v_offer.quantity_kg,
          coalesce(p_fresh_until, (now() + make_interval(days => coalesce(v_offer.shelf_life_days, 5)))::date));

  insert into public.notifications (user_id, message, link)
  values (v_offer.petani_id,
          format('Pembayaran %s %s kg (Rp%s) tercatat lunas. Transaksi selesai!', v_offer.fruit_type, v_offer.quantity_kg, v_subtotal),
          '/dashboard/petani/riwayat');
end;
$$;

revoke execute on function public.complete_offer(uuid, text, date) from public, anon;
grant execute on function public.complete_offer(uuid, text, date) to authenticated;

-- ---------- Chat Petani ↔ UMKM ----------
create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  offer_id        uuid not null references public.offers (id) on delete cascade,
  petani_id       uuid not null references public.profiles (id) on delete cascade,
  umkm_id         uuid not null references public.profiles (id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  unique (offer_id, umkm_id)
);
create index if not exists conversations_petani_idx on public.conversations (petani_id, last_message_at desc);
create index if not exists conversations_umkm_idx on public.conversations (umkm_id, last_message_at desc);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references public.profiles (id) on delete cascade,
  body            text not null check (char_length(body) between 1 and 2000),
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create or replace function public.is_conversation_member(p_conversation_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.conversations c
     where c.id = p_conversation_id and (select auth.uid()) in (c.petani_id, c.umkm_id)
  )
$$;

create policy "members read conversations" on public.conversations
  for select to authenticated using ((select auth.uid()) in (petani_id, umkm_id));

create policy "members read messages" on public.messages
  for select to authenticated using (public.is_conversation_member(conversation_id));
create policy "members send messages" on public.messages
  for insert to authenticated
  with check (sender_id = (select auth.uid()) and public.is_conversation_member(conversation_id));
create policy "members mark messages read" on public.messages
  for update to authenticated
  using (public.is_conversation_member(conversation_id) and sender_id <> (select auth.uid()))
  with check (public.is_conversation_member(conversation_id));

-- Mulai (atau ambil) percakapan untuk satu penawaran. Dipanggil UMKM.
create or replace function public.start_conversation(p_offer_id uuid)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_offer public.offers;
  v_id    uuid;
begin
  if (select role from public.profiles where id = auth.uid()) is distinct from 'umkm' then
    raise exception 'Hanya UMKM yang dapat memulai percakapan';
  end if;

  select * into v_offer from public.offers
   where id = p_offer_id and (status = 'menawarkan' or accepted_by = auth.uid());
  if not found then
    raise exception 'Penawaran tidak tersedia';
  end if;

  insert into public.conversations (offer_id, petani_id, umkm_id)
  values (v_offer.id, v_offer.petani_id, auth.uid())
  on conflict (offer_id, umkm_id) do update set offer_id = excluded.offer_id
  returning id into v_id;

  return v_id;
end;
$$;

-- Perbarui waktu pesan terakhir setiap ada pesan baru
create or replace function public.touch_conversation()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

create trigger on_message_created
  after insert on public.messages
  for each row execute function public.touch_conversation();

revoke execute on function public.start_conversation(uuid) from public, anon;
grant execute on function public.start_conversation(uuid) to authenticated;
revoke execute on function public.is_conversation_member(uuid) from public, anon;
grant execute on function public.is_conversation_member(uuid) to authenticated;
revoke execute on function public.touch_conversation() from public, anon, authenticated;

-- Chat real-time
alter publication supabase_realtime add table public.messages;

-- Menerima penawaran juga otomatis membuka percakapan dengan petani
create or replace function public.accept_offer(p_offer_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_offer public.offers;
  v_umkm  public.profiles;
begin
  select * into v_umkm from public.profiles where id = auth.uid();
  if v_umkm.role is distinct from 'umkm' then
    raise exception 'Hanya UMKM yang dapat menerima penawaran';
  end if;

  update public.offers
     set status = 'diterima', accepted_by = auth.uid(), accepted_at = now()
   where id = p_offer_id and status = 'menawarkan'
  returning * into v_offer;

  if not found then
    raise exception 'Penawaran sudah tidak tersedia';
  end if;

  insert into public.conversations (offer_id, petani_id, umkm_id)
  values (v_offer.id, v_offer.petani_id, auth.uid())
  on conflict (offer_id, umkm_id) do nothing;

  insert into public.notifications (user_id, message, link)
  values (v_offer.petani_id,
          format('Penawaran %s %s kg diterima oleh %s', v_offer.fruit_type, v_offer.quantity_kg, v_umkm.business_name),
          '/dashboard/petani/riwayat');
end;
$$;

-- ---------- Lengkapi data lama ----------
-- Semua transaksi selesai: hitung subtotal & biaya layanan dari data yang ada
update public.offers
   set subtotal = round(quantity_kg * price_per_kg)::integer,
       service_fee = public.service_fee_for(round(quantity_kg * price_per_kg)::integer),
       total_paid = round(quantity_kg * price_per_kg)::integer + public.service_fee_for(round(quantity_kg * price_per_kg)::integer),
       paid_at = coalesce(paid_at, completed_at)
 where status = 'selesai' and subtotal is null;

-- Khusus akun demo (@agriloss.demo): isi contoh harga pasar, masa layak, & metode bayar
update public.offers o
   set market_price_per_kg = coalesce(o.market_price_per_kg, o.price_per_kg * 3),
       shelf_life_days = coalesce(o.shelf_life_days, 4),
       payment_method = case when o.status = 'selesai' then coalesce(o.payment_method, 'qris') else o.payment_method end
  from auth.users u
 where u.id = o.petani_id and u.email like '%@agriloss.demo';

update public.products set category = 'minuman',        fruit = 'Melon'    where name ilike '%es krim melon%' and umkm_id in (select id from auth.users where email like '%@agriloss.demo');
update public.products set category = 'minuman',        fruit = 'Stroberi' where name ilike '%es krim stroberi%' and umkm_id in (select id from auth.users where email like '%@agriloss.demo');
update public.products set category = 'minuman',        fruit = 'Mangga'   where name ilike '%smoothie mangga%' and umkm_id in (select id from auth.users where email like '%@agriloss.demo');
update public.products set category = 'selai_olesan',   fruit = 'Stroberi' where name ilike '%selai stroberi%' and umkm_id in (select id from auth.users where email like '%@agriloss.demo');
update public.products set category = 'minuman',        fruit = 'Jeruk'    where name ilike '%jus jeruk%' and umkm_id in (select id from auth.users where email like '%@agriloss.demo');
update public.products set category = 'kue_roti',       fruit = 'Mangga'   where name ilike '%puding mangga%' and umkm_id in (select id from auth.users where email like '%@agriloss.demo');
update public.products set category = 'makanan_ringan', fruit = 'Nangka'   where name ilike '%keripik nangka%' and umkm_id in (select id from auth.users where email like '%@agriloss.demo');
update public.products set category = 'makanan_ringan', fruit = 'Pepaya'   where name ilike '%manisan pepaya%' and umkm_id in (select id from auth.users where email like '%@agriloss.demo');
update public.products set category = 'makanan_ringan', fruit = 'Apel'     where name ilike '%keripik apel%' and umkm_id in (select id from auth.users where email like '%@agriloss.demo');

-- Percakapan untuk penawaran yang sudah diterima/selesai
insert into public.conversations (offer_id, petani_id, umkm_id)
select id, petani_id, accepted_by from public.offers
 where accepted_by is not null
on conflict (offer_id, umkm_id) do nothing;
