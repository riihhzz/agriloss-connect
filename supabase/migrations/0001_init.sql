-- =====================================================================
-- AgriLoss.Connect — skema awal
-- Peran: petani (menawarkan hasil panen) & umkm (menerima & mengolah)
-- Alur penawaran: menawarkan -> diterima -> selesai | (batal -> menawarkan)
-- =====================================================================

-- ---------- Tipe ----------
create type public.user_role as enum ('petani', 'umkm');
create type public.offer_status as enum ('menawarkan', 'diterima', 'selesai', 'dibatalkan');
create type public.ripeness as enum ('mentah', 'setengah_matang', 'matang', 'sangat_matang');

-- ---------- Profil pengguna ----------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  role          public.user_role not null,
  full_name     text not null,
  business_name text,                         -- wajib untuk UMKM
  description   text,
  whatsapp      text,
  location      text,
  latitude      double precision,
  longitude     double precision,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  constraint umkm_has_business_name check (role <> 'umkm' or business_name is not null)
);

-- ---------- Penawaran hasil panen (oleh petani) ----------
create table public.offers (
  id            uuid primary key default gen_random_uuid(),
  petani_id     uuid not null references public.profiles (id) on delete cascade,
  fruit_type    text not null,
  ripeness      public.ripeness not null default 'matang',
  quantity_kg   numeric(10,2) not null check (quantity_kg > 0),
  price_per_kg  integer not null check (price_per_kg >= 0),
  location      text not null,
  whatsapp      text not null,
  notes         text,
  photo_url     text,
  status        public.offer_status not null default 'menawarkan',
  accepted_by   uuid references public.profiles (id) on delete set null,
  accepted_at   timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz not null default now()
);
create index offers_status_idx on public.offers (status);
create index offers_petani_idx on public.offers (petani_id);
create index offers_accepted_by_idx on public.offers (accepted_by);

-- ---------- Produk olahan (katalog UMKM) ----------
create table public.products (
  id            uuid primary key default gen_random_uuid(),
  umkm_id       uuid not null references public.profiles (id) on delete cascade,
  name          text not null,
  description   text,
  price         integer not null check (price >= 0),
  image_url     text,
  is_available  boolean not null default true,
  created_at    timestamptz not null default now()
);
create index products_umkm_idx on public.products (umkm_id);

-- ---------- Stok bahan baku (milik UMKM, berasal dari penawaran selesai) ----------
create table public.stocks (
  id            uuid primary key default gen_random_uuid(),
  umkm_id       uuid not null references public.profiles (id) on delete cascade,
  offer_id      uuid unique references public.offers (id) on delete set null,
  petani_name   text not null,
  fruit_type    text not null,
  quantity_kg   numeric(10,2) not null check (quantity_kg > 0),
  used_kg       numeric(10,2) not null default 0 check (used_kg >= 0),
  fresh_until   date,
  created_at    timestamptz not null default now(),
  constraint used_not_exceed check (used_kg <= quantity_kg)
);
create index stocks_umkm_idx on public.stocks (umkm_id);

create table public.stock_usages (
  id            uuid primary key default gen_random_uuid(),
  stock_id      uuid not null references public.stocks (id) on delete cascade,
  amount_kg     numeric(10,2) not null check (amount_kg > 0),
  note          text,
  created_at    timestamptz not null default now()
);
create index stock_usages_stock_idx on public.stock_usages (stock_id);

-- ---------- Notifikasi ----------
create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  message       text not null,
  link          text,
  is_read       boolean not null default false,
  created_at    timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, is_read);

-- =====================================================================
-- Helper
-- =====================================================================
create or replace function public.my_role()
returns public.user_role
language sql stable security definer set search_path = ''
as $$ select role from public.profiles where id = auth.uid() $$;

-- Buat profil otomatis saat user mendaftar (data dari user_metadata)
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name, business_name, whatsapp, location)
  values (
    new.id,
    (new.raw_user_meta_data ->> 'role')::public.user_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'business_name', ''),
    nullif(new.raw_user_meta_data ->> 'whatsapp', ''),
    nullif(new.raw_user_meta_data ->> 'location', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- Alur penawaran (RPC, dipanggil UMKM)
-- =====================================================================

-- 1) UMKM menerima penawaran -> status 'diterima' (dikunci untuk UMKM ini)
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

  insert into public.notifications (user_id, message, link)
  values (v_offer.petani_id,
          format('Penawaran %s %s kg diterima oleh %s', v_offer.fruit_type, v_offer.quantity_kg, v_umkm.business_name),
          '/dashboard/petani/riwayat');
end;
$$;

-- 2a) UMKM melanjutkan -> 'selesai' + otomatis masuk stok
create or replace function public.complete_offer(p_offer_id uuid, p_fresh_until date default null)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_offer  public.offers;
  v_petani text;
begin
  update public.offers
     set status = 'selesai', completed_at = now()
   where id = p_offer_id and status = 'diterima' and accepted_by = auth.uid()
  returning * into v_offer;

  if not found then
    raise exception 'Penawaran tidak dapat diselesaikan';
  end if;

  select full_name into v_petani from public.profiles where id = v_offer.petani_id;

  insert into public.stocks (umkm_id, offer_id, petani_name, fruit_type, quantity_kg, fresh_until)
  values (auth.uid(), v_offer.id, v_petani, v_offer.fruit_type, v_offer.quantity_kg,
          coalesce(p_fresh_until, (now() + interval '5 days')::date));

  insert into public.notifications (user_id, message, link)
  values (v_offer.petani_id,
          format('Transaksi %s %s kg selesai. Terima kasih telah mengurangi food loss!', v_offer.fruit_type, v_offer.quantity_kg),
          '/dashboard/petani/riwayat');
end;
$$;

-- 2b) UMKM membatalkan -> kembali 'menawarkan' agar UMKM lain bisa menerima
create or replace function public.cancel_acceptance(p_offer_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_offer public.offers;
begin
  update public.offers
     set status = 'menawarkan', accepted_by = null, accepted_at = null
   where id = p_offer_id and status = 'diterima' and accepted_by = auth.uid()
  returning * into v_offer;

  if not found then
    raise exception 'Penawaran tidak dapat dibatalkan';
  end if;

  insert into public.notifications (user_id, message, link)
  values (v_offer.petani_id,
          format('UMKM membatalkan penerimaan %s. Penawaranmu kembali tersedia.', v_offer.fruit_type),
          '/dashboard/petani/riwayat');
end;
$$;

-- Petani menarik penawaran yang belum diterima
create or replace function public.withdraw_offer(p_offer_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.offers set status = 'dibatalkan'
   where id = p_offer_id and petani_id = auth.uid() and status = 'menawarkan';
  if not found then
    raise exception 'Penawaran tidak dapat ditarik';
  end if;
end;
$$;

-- Catat pemakaian stok
create or replace function public.record_stock_usage(p_stock_id uuid, p_amount numeric, p_note text default null)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.stocks set used_kg = used_kg + p_amount
   where id = p_stock_id and umkm_id = auth.uid() and used_kg + p_amount <= quantity_kg;
  if not found then
    raise exception 'Jumlah pemakaian melebihi sisa stok';
  end if;
  insert into public.stock_usages (stock_id, amount_kg, note) values (p_stock_id, p_amount, p_note);
end;
$$;

-- =====================================================================
-- Statistik
-- =====================================================================
create or replace function public.get_public_stats()
returns table (petani_count bigint, umkm_count bigint, saved_kg numeric)
language sql stable security definer set search_path = ''
as $$
  select
    (select count(*) from public.profiles where role = 'petani'),
    (select count(*) from public.profiles where role = 'umkm'),
    (select coalesce(sum(quantity_kg), 0) from public.offers where status = 'selesai');
$$;

create or replace function public.get_my_stats()
returns table (stat_a bigint, stat_b bigint, saved_kg numeric)
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_role public.user_role;
begin
  select role into v_role from public.profiles where id = auth.uid();
  if v_role = 'petani' then
    -- stat_a: penawaran aktif, stat_b: diterima UMKM (menunggu), saved: kg selesai
    return query select
      (select count(*) from public.offers where petani_id = auth.uid() and status = 'menawarkan'),
      (select count(*) from public.offers where petani_id = auth.uid() and status = 'diterima'),
      (select coalesce(sum(quantity_kg), 0) from public.offers where petani_id = auth.uid() and status = 'selesai');
  else
    -- stat_a: jumlah produk, stat_b: penawaran petani tersedia, saved: kg selesai oleh UMKM ini
    return query select
      (select count(*) from public.products where umkm_id = auth.uid()),
      (select count(*) from public.offers where status = 'menawarkan'),
      (select coalesce(sum(quantity_kg), 0) from public.offers where accepted_by = auth.uid() and status = 'selesai');
  end if;
end;
$$;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles      enable row level security;
alter table public.offers        enable row level security;
alter table public.products      enable row level security;
alter table public.stocks        enable row level security;
alter table public.stock_usages  enable row level security;
alter table public.notifications enable row level security;

-- profiles: publik bisa membaca (nama usaha, lokasi untuk katalog), user ubah miliknya
create policy "profiles readable by everyone" on public.profiles
  for select using (true);
create policy "users update own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- offers
create policy "petani reads own offers" on public.offers
  for select to authenticated using (petani_id = (select auth.uid()));
create policy "umkm reads open or own accepted offers" on public.offers
  for select to authenticated
  using ((select public.my_role()) = 'umkm' and (status = 'menawarkan' or accepted_by = (select auth.uid())));
create policy "petani creates offers" on public.offers
  for insert to authenticated
  with check (petani_id = (select auth.uid()) and (select public.my_role()) = 'petani' and status = 'menawarkan');

-- products: publik membaca, UMKM kelola miliknya
create policy "products readable by everyone" on public.products
  for select using (true);
create policy "umkm inserts own products" on public.products
  for insert to authenticated
  with check (umkm_id = (select auth.uid()) and (select public.my_role()) = 'umkm');
create policy "umkm updates own products" on public.products
  for update to authenticated using (umkm_id = (select auth.uid())) with check (umkm_id = (select auth.uid()));
create policy "umkm deletes own products" on public.products
  for delete to authenticated using (umkm_id = (select auth.uid()));

-- stocks & usages: hanya pemilik
create policy "umkm reads own stocks" on public.stocks
  for select to authenticated using (umkm_id = (select auth.uid()));
create policy "umkm reads own usages" on public.stock_usages
  for select to authenticated
  using (exists (select 1 from public.stocks s where s.id = stock_id and s.umkm_id = (select auth.uid())));

-- notifications
create policy "users read own notifications" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "users mark own notifications" on public.notifications
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- RPC hanya untuk user login
revoke execute on function public.accept_offer(uuid), public.complete_offer(uuid, date),
  public.cancel_acceptance(uuid), public.withdraw_offer(uuid),
  public.record_stock_usage(uuid, numeric, text), public.get_my_stats() from public, anon;
grant execute on function public.accept_offer(uuid), public.complete_offer(uuid, date),
  public.cancel_acceptance(uuid), public.withdraw_offer(uuid),
  public.record_stock_usage(uuid, numeric, text), public.get_my_stats() to authenticated;
grant execute on function public.get_public_stats() to anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- =====================================================================
-- Storage: foto penawaran, produk, avatar (publik baca, upload ke folder uid)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('offer-photos',   'offer-photos',   true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('avatars',        'avatars',        true, 2097152, array['image/jpeg','image/png','image/webp']);

create policy "users upload to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('offer-photos','product-images','avatars')
              and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "users update own files" on storage.objects
  for update to authenticated
  using (bucket_id in ('offer-photos','product-images','avatars')
         and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "users delete own files" on storage.objects
  for delete to authenticated
  using (bucket_id in ('offer-photos','product-images','avatars')
         and (storage.foldername(name))[1] = (select auth.uid())::text);
