-- =====================================================================
-- 0006 — Simulasi pembayaran (QRIS / Virtual Account) & Saldo Agriloss
--
-- Alur baru transaksi:
--   UMKM pilih metode -> tagihan dibuat (status "menunggu") -> UMKM membayar
--   lewat simulator QRIS / Virtual Account (pengganti gateway sungguhan)
--   -> server mencatat "berhasil" -> penawaran selesai, stok masuk,
--   saldo petani bertambah, notifikasi ke kedua pihak.
-- UMKM juga bisa membayar langsung dengan Saldo Agriloss.
-- Tidak ada uang sungguhan: semua pembayaran adalah simulasi.
--
-- Jalankan di Supabase Dashboard > SQL Editor (sekali saja).
-- =====================================================================

-- ---------- Format angka untuk pesan notifikasi ----------
create or replace function public.fmt_rupiah(p_value bigint)
returns text
language sql immutable set search_path = ''
as $$ select 'Rp' || replace(to_char(p_value, 'FM999,999,999,990'), ',', '.') $$;

create or replace function public.fmt_kg(p_value numeric)
returns text
language sql immutable set search_path = ''
as $$ select trim_scale(p_value)::text || ' kg' $$;

-- ---------- Metode bayar baru di penawaran ----------
alter table public.offers drop constraint if exists offers_payment_method_check;
alter table public.offers
  add constraint offers_payment_method_check
  check (payment_method in ('qris', 'va', 'saldo', 'transfer', 'tunai'));

-- ---------- Tabel ----------
create table if not exists public.wallets (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  balance    bigint not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('transaksi', 'isi_saldo')),
  payer_id    uuid not null references public.profiles (id) on delete cascade,
  payee_id    uuid references public.profiles (id) on delete set null,
  offer_id    uuid references public.offers (id) on delete cascade,
  method      text not null check (method in ('qris', 'va', 'saldo')),
  bank        text check (bank in ('bca', 'bni', 'bri', 'mandiri')),
  va_number   text,
  subtotal    integer not null check (subtotal >= 0),
  service_fee integer not null default 0 check (service_fee >= 0),
  amount      integer not null check (amount > 0),
  fresh_until date,
  status      text not null default 'menunggu' check (status in ('menunggu', 'berhasil', 'dibatalkan')),
  expires_at  timestamptz not null,
  paid_at     timestamptz,
  created_at  timestamptz not null default now(),
  constraint payment_kind_offer check ((kind = 'transaksi') = (offer_id is not null))
);
create index if not exists payments_payer_idx on public.payments (payer_id, created_at desc);
create index if not exists payments_payee_idx on public.payments (payee_id);
create index if not exists payments_offer_idx on public.payments (offer_id);

create table if not exists public.wallet_transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  type          text not null check (type in ('pemasukan', 'isi_saldo', 'pembayaran', 'penarikan')),
  amount        integer not null,            -- positif = masuk, negatif = keluar
  balance_after bigint not null,
  description   text not null,
  payment_id    uuid references public.payments (id) on delete set null,
  offer_id      uuid references public.offers (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists wallet_tx_user_idx on public.wallet_transactions (user_id, created_at desc);

create table if not exists public.withdrawals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  amount         integer not null check (amount >= 10000),
  bank           text not null,
  account_number text not null,
  account_name   text not null,
  status         text not null default 'berhasil' check (status in ('diproses', 'berhasil', 'gagal')),
  created_at     timestamptz not null default now()
);
create index if not exists withdrawals_user_idx on public.withdrawals (user_id, created_at desc);

-- ---------- Keamanan: hanya bisa dibaca pemiliknya, ditulis lewat fungsi ----------
alter table public.wallets enable row level security;
alter table public.payments enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.withdrawals enable row level security;

create policy "own wallet" on public.wallets
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own payments" on public.payments
  for select to authenticated using ((select auth.uid()) in (payer_id, payee_id));
create policy "own wallet transactions" on public.wallet_transactions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own withdrawals" on public.withdrawals
  for select to authenticated using (user_id = (select auth.uid()));

revoke insert, update, delete on public.wallets, public.payments, public.wallet_transactions, public.withdrawals
  from anon, authenticated;

-- ---------- Mutasi saldo (internal) ----------
create or replace function public.wallet_change(
  p_user uuid, p_amount integer, p_type text, p_description text,
  p_payment_id uuid default null, p_offer_id uuid default null
)
returns bigint
language plpgsql security definer set search_path = ''
as $$
declare
  v_balance bigint;
begin
  insert into public.wallets (user_id) values (p_user) on conflict (user_id) do nothing;
  select balance into v_balance from public.wallets where user_id = p_user for update;
  if v_balance + p_amount < 0 then
    raise exception 'Saldo tidak cukup';
  end if;

  update public.wallets set balance = v_balance + p_amount, updated_at = now() where user_id = p_user;
  insert into public.wallet_transactions (user_id, type, amount, balance_after, description, payment_id, offer_id)
  values (p_user, p_type, p_amount, v_balance + p_amount, p_description, p_payment_id, p_offer_id);
  return v_balance + p_amount;
end;
$$;

-- ---------- Pelunasan (internal; dipanggil setelah pembayaran terkonfirmasi) ----------
create or replace function public.settle_payment(p_payment_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_pay    public.payments;
  v_offer  public.offers;
  v_petani text;
  v_umkm   text;
begin
  select * into v_pay from public.payments where id = p_payment_id for update;
  if not found or v_pay.status <> 'menunggu' then
    raise exception 'Tagihan ini sudah tidak menunggu pembayaran';
  end if;
  if v_pay.expires_at < now() then
    raise exception 'Tagihan sudah kedaluwarsa. Buat pembayaran baru.';
  end if;

  update public.payments set status = 'berhasil', paid_at = now() where id = p_payment_id;

  -- Isi saldo
  if v_pay.kind = 'isi_saldo' then
    perform public.wallet_change(v_pay.payer_id, v_pay.amount, 'isi_saldo',
      format('Isi saldo via %s', case v_pay.method when 'qris' then 'QRIS' else 'Virtual Account ' || upper(v_pay.bank) end),
      p_payment_id, null);
    insert into public.notifications (user_id, message, link)
    values (v_pay.payer_id, format('Isi saldo %s berhasil.', public.fmt_rupiah(v_pay.amount)), '/dashboard/umkm/saldo');
    return;
  end if;

  -- Pembayaran transaksi penawaran
  select * into v_offer from public.offers where id = v_pay.offer_id for update;
  if v_offer.status <> 'diterima' or v_offer.accepted_by is distinct from v_pay.payer_id then
    raise exception 'Penawaran tidak lagi menunggu pembayaran';
  end if;

  update public.offers
     set status = 'selesai', completed_at = now(), paid_at = now(),
         payment_method = v_pay.method, subtotal = v_pay.subtotal,
         service_fee = v_pay.service_fee, total_paid = v_pay.amount
   where id = v_offer.id;

  select full_name into v_petani from public.profiles where id = v_offer.petani_id;
  select coalesce(business_name, full_name) into v_umkm from public.profiles where id = v_pay.payer_id;

  insert into public.stocks (umkm_id, offer_id, petani_name, fruit_type, quantity_kg, fresh_until)
  values (v_pay.payer_id, v_offer.id, v_petani, v_offer.fruit_type, v_offer.quantity_kg,
          coalesce(v_pay.fresh_until, (now() + make_interval(days => coalesce(v_offer.shelf_life_days, 5)))::date));

  -- Petani menerima penuh nilai buah ke Saldo Agriloss
  perform public.wallet_change(v_offer.petani_id, v_pay.subtotal, 'pemasukan',
    format('Penjualan %s %s ke %s', v_offer.fruit_type, public.fmt_kg(v_offer.quantity_kg), v_umkm),
    p_payment_id, v_offer.id);

  insert into public.notifications (user_id, message, link) values
    (v_offer.petani_id,
     format('Pembayaran %s %s dari %s lunas. Saldo bertambah %s.',
            v_offer.fruit_type, public.fmt_kg(v_offer.quantity_kg), v_umkm, public.fmt_rupiah(v_pay.subtotal)),
     '/dashboard/petani/saldo'),
    (v_pay.payer_id,
     format('Pembayaran %s berhasil. %s %s sudah masuk ke Stok.',
            public.fmt_rupiah(v_pay.amount), v_offer.fruit_type, public.fmt_kg(v_offer.quantity_kg)),
     '/dashboard/umkm/stok');
end;
$$;

-- Nomor Virtual Account simulasi: kode bank + 10 digit acak
create or replace function public.make_va_number(p_bank text)
returns text
language sql volatile set search_path = ''
as $$
  select (case p_bank when 'bca' then '39358' when 'bni' then '98810' when 'bri' then '26215' else '89608' end)
         || lpad(floor(random() * 10000000000)::bigint::text, 10, '0')
$$;

-- ---------- UMKM membuat tagihan untuk penawaran yang diterimanya ----------
create or replace function public.create_payment(
  p_offer_id uuid, p_method text, p_bank text default null, p_fresh_until date default null
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_offer    public.offers;
  v_subtotal integer;
  v_fee      integer;
  v_id       uuid;
begin
  if p_method not in ('qris', 'va', 'saldo') then
    raise exception 'Metode pembayaran tidak valid';
  end if;
  if p_method = 'va' and (p_bank is null or p_bank not in ('bca', 'bni', 'bri', 'mandiri')) then
    raise exception 'Pilih bank untuk Virtual Account';
  end if;

  select * into v_offer from public.offers
   where id = p_offer_id and status = 'diterima' and accepted_by = auth.uid()
   for update;
  if not found then
    raise exception 'Penawaran tidak dapat dibayar';
  end if;

  -- Tagihan lama yang belum dibayar untuk penawaran ini dibatalkan
  update public.payments set status = 'dibatalkan' where offer_id = p_offer_id and status = 'menunggu';

  v_subtotal := round(v_offer.quantity_kg * v_offer.price_per_kg)::integer;
  v_fee := public.service_fee_for(v_subtotal);

  insert into public.payments (kind, payer_id, payee_id, offer_id, method, bank, va_number,
                               subtotal, service_fee, amount, fresh_until, expires_at)
  values ('transaksi', auth.uid(), v_offer.petani_id, p_offer_id, p_method,
          case when p_method = 'va' then p_bank end,
          case when p_method = 'va' then public.make_va_number(p_bank) end,
          v_subtotal, v_fee, v_subtotal + v_fee, p_fresh_until,
          now() + case p_method when 'qris' then interval '15 minutes' when 'va' then interval '24 hours' else interval '5 minutes' end)
  returning id into v_id;

  -- Bayar pakai saldo: langsung potong & lunasi
  if p_method = 'saldo' then
    perform public.wallet_change(auth.uid(), -(v_subtotal + v_fee), 'pembayaran',
      format('Bayar %s %s (termasuk biaya layanan %s)', v_offer.fruit_type, public.fmt_kg(v_offer.quantity_kg), public.fmt_rupiah(v_fee)),
      v_id, p_offer_id);
    perform public.settle_payment(v_id);
  end if;

  return v_id;
end;
$$;

-- ---------- Isi saldo (UMKM / siapa pun yang login) ----------
create or replace function public.create_topup(p_amount integer, p_method text, p_bank text default null)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Silakan masuk terlebih dahulu';
  end if;
  if p_amount is null or p_amount < 10000 or p_amount > 10000000 then
    raise exception 'Nominal isi saldo antara Rp10.000 dan Rp10.000.000';
  end if;
  if p_method not in ('qris', 'va') then
    raise exception 'Metode isi saldo tidak valid';
  end if;
  if p_method = 'va' and (p_bank is null or p_bank not in ('bca', 'bni', 'bri', 'mandiri')) then
    raise exception 'Pilih bank untuk Virtual Account';
  end if;

  insert into public.payments (kind, payer_id, method, bank, va_number, subtotal, service_fee, amount, expires_at)
  values ('isi_saldo', auth.uid(), p_method,
          case when p_method = 'va' then p_bank end,
          case when p_method = 'va' then public.make_va_number(p_bank) end,
          p_amount, 0, p_amount,
          now() + case p_method when 'qris' then interval '15 minutes' else interval '24 hours' end)
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------- Simulator gateway ----------
-- Menggantikan notifikasi (webhook) dari payment gateway. ID tagihan (UUID acak)
-- berperan sebagai token, sehingga halaman simulator bisa dibuka dari HP lain
-- dengan memindai QR tanpa login.
create or replace function public.simulate_payment(p_payment_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.settle_payment(p_payment_id);
end;
$$;

-- Data minimal untuk halaman simulator (tanpa login)
create or replace function public.get_payment_for_simulator(p_payment_id uuid)
returns table (
  id uuid, kind text, method text, bank text, va_number text, amount integer,
  status text, expires_at timestamptz, merchant text, description text
)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.kind, p.method, p.bank, p.va_number, p.amount, p.status, p.expires_at,
         'Agriloss.Connect'::text,
         case when p.kind = 'isi_saldo' then 'Isi Saldo Agriloss'
              else 'Pembelian ' || o.fruit_type || ' ' || public.fmt_kg(o.quantity_kg) end
    from public.payments p
    left join public.offers o on o.id = p.offer_id
   where p.id = p_payment_id
$$;

create or replace function public.cancel_payment(p_payment_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.payments set status = 'dibatalkan'
   where id = p_payment_id and payer_id = auth.uid() and status = 'menunggu';
  if not found then
    raise exception 'Tagihan tidak dapat dibatalkan';
  end if;
end;
$$;

-- ---------- Tarik saldo (simulasi: langsung berhasil) ----------
create or replace function public.request_withdrawal(
  p_amount integer, p_bank text, p_account_number text, p_account_name text
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
  v_role public.user_role;
begin
  if auth.uid() is null then
    raise exception 'Silakan masuk terlebih dahulu';
  end if;
  if p_amount is null or p_amount < 10000 then
    raise exception 'Minimal penarikan Rp10.000';
  end if;
  if coalesce(trim(p_bank), '') = '' or coalesce(trim(p_account_name), '') = '' then
    raise exception 'Lengkapi bank / e-wallet dan nama pemilik rekening';
  end if;
  if p_account_number !~ '^[0-9]{8,20}$' then
    raise exception 'Nomor rekening / e-wallet harus 8–20 digit angka';
  end if;

  insert into public.withdrawals (user_id, amount, bank, account_number, account_name)
  values (auth.uid(), p_amount, trim(p_bank), p_account_number, trim(p_account_name))
  returning id into v_id;

  perform public.wallet_change(auth.uid(), -p_amount, 'penarikan',
    format('Tarik saldo ke %s •••%s', trim(p_bank), right(p_account_number, 4)), null, null);

  select role into v_role from public.profiles where id = auth.uid();
  insert into public.notifications (user_id, message, link)
  values (auth.uid(),
          format('Penarikan %s ke %s berhasil diproses.', public.fmt_rupiah(p_amount), trim(p_bank)),
          '/dashboard/' || v_role || '/saldo');
  return v_id;
end;
$$;

-- ---------- Notifikasi untuk UMKM saat ada penawaran baru ----------
create or replace function public.notify_umkm_new_offer()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.notifications (user_id, message, link)
  select u.id,
         format('Penawaran baru: %s %s dari %s (%s).', new.fruit_type, public.fmt_kg(new.quantity_kg),
                coalesce(pt.full_name, 'petani'), new.location),
         '/dashboard/umkm/penawaran/' || new.id
    from public.profiles u
    left join public.profiles pt on pt.id = new.petani_id
   where u.role = 'umkm';
  return new;
end;
$$;

drop trigger if exists on_offer_created_notify_umkm on public.offers;
create trigger on_offer_created_notify_umkm
  after insert on public.offers
  for each row execute function public.notify_umkm_new_offer();

-- ---------- Hak eksekusi ----------
-- Fungsi internal: tidak bisa dipanggil dari luar
revoke execute on function public.wallet_change(uuid, integer, text, text, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.settle_payment(uuid) from public, anon, authenticated;
revoke execute on function public.make_va_number(text) from public, anon, authenticated;
revoke execute on function public.notify_umkm_new_offer() from public, anon, authenticated;

-- Transaksi kini wajib lewat pembayaran (create_payment), bukan pencatatan langsung
revoke execute on function public.complete_offer(uuid, text, date) from public, anon, authenticated;

revoke execute on function public.create_payment(uuid, text, text, date) from public, anon;
revoke execute on function public.create_topup(integer, text, text) from public, anon;
revoke execute on function public.cancel_payment(uuid) from public, anon;
revoke execute on function public.request_withdrawal(integer, text, text, text) from public, anon;
grant execute on function public.create_payment(uuid, text, text, date) to authenticated;
grant execute on function public.create_topup(integer, text, text) to authenticated;
grant execute on function public.cancel_payment(uuid) to authenticated;
grant execute on function public.request_withdrawal(integer, text, text, text) to authenticated;

-- Simulator boleh dibuka tanpa login (pemindai QR di HP lain)
grant execute on function public.simulate_payment(uuid) to anon, authenticated;
grant execute on function public.get_payment_for_simulator(uuid) to anon, authenticated;

-- ---------- Saldo awal untuk transaksi demo yang sudah selesai ----------
-- Petani demo menerima saldo dari penjualan yang sudah lunas sebelum fitur ini ada
do $$
declare
  r record;
begin
  for r in
    select o.id, o.petani_id, o.fruit_type, o.quantity_kg, o.subtotal, coalesce(b.business_name, b.full_name) as buyer
      from public.offers o
      join auth.users u on u.id = o.petani_id and u.email like '%@agriloss.demo'
      left join public.profiles b on b.id = o.accepted_by
     where o.status = 'selesai' and o.subtotal > 0
       and not exists (select 1 from public.wallet_transactions t where t.offer_id = o.id and t.type = 'pemasukan')
     order by o.completed_at
  loop
    perform public.wallet_change(r.petani_id, r.subtotal, 'pemasukan',
      format('Penjualan %s %s ke %s', r.fruit_type, public.fmt_kg(r.quantity_kg), r.buyer), null, r.id);
  end loop;

  -- UMKM demo mendapat saldo awal Rp500.000 untuk mencoba bayar pakai saldo
  for r in
    select p.id from public.profiles p join auth.users u on u.id = p.id
     where p.role = 'umkm' and u.email like '%@agriloss.demo'
       and not exists (select 1 from public.wallet_transactions t where t.user_id = p.id)
  loop
    perform public.wallet_change(r.id, 500000, 'isi_saldo', 'Saldo awal akun demo', null, null);
  end loop;
end;
$$;
