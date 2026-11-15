-- =====================================================================
-- 0007 — Bayar Tunai (COD) tanpa biaya layanan
--
-- UMKM memilih Tunai -> tagihan tunai dibuat (berlaku 3 hari) -> UMKM
-- menyerahkan uang langsung ke petani saat menjemput buah -> PETANI
-- menekan "Uang sudah saya terima" -> transaksi selesai & stok masuk.
-- Uang tunai tidak lewat Saldo Agriloss, dan tidak dikenai biaya layanan.
--
-- Jalankan di Supabase Dashboard > SQL Editor (sekali saja).
-- =====================================================================

alter table public.payments drop constraint if exists payments_method_check;
alter table public.payments
  add constraint payments_method_check check (method in ('qris', 'va', 'saldo', 'tunai'));

-- ---------- Pelunasan: cabang khusus tunai ----------
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

  if v_pay.method = 'tunai' then
    -- Uang sudah dipegang petani: saldo tidak berubah
    insert into public.notifications (user_id, message, link) values
      (v_offer.petani_id,
       format('Pembayaran tunai %s untuk %s %s tercatat lunas.', public.fmt_rupiah(v_pay.amount), v_offer.fruit_type, public.fmt_kg(v_offer.quantity_kg)),
       '/dashboard/petani/riwayat'),
      (v_pay.payer_id,
       format('Petani mengonfirmasi uang tunai %s diterima. %s %s sudah masuk ke Stok.',
              public.fmt_rupiah(v_pay.amount), v_offer.fruit_type, public.fmt_kg(v_offer.quantity_kg)),
       '/dashboard/umkm/stok');
    return;
  end if;

  -- Non-tunai: petani menerima penuh nilai buah ke Saldo Agriloss
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

-- ---------- Buat tagihan: tunai tanpa biaya layanan ----------
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
  v_umkm     text;
begin
  if p_method not in ('qris', 'va', 'saldo', 'tunai') then
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

  update public.payments set status = 'dibatalkan' where offer_id = p_offer_id and status = 'menunggu';

  v_subtotal := round(v_offer.quantity_kg * v_offer.price_per_kg)::integer;
  v_fee := case when p_method = 'tunai' then 0 else public.service_fee_for(v_subtotal) end;

  insert into public.payments (kind, payer_id, payee_id, offer_id, method, bank, va_number,
                               subtotal, service_fee, amount, fresh_until, expires_at)
  values ('transaksi', auth.uid(), v_offer.petani_id, p_offer_id, p_method,
          case when p_method = 'va' then p_bank end,
          case when p_method = 'va' then public.make_va_number(p_bank) end,
          v_subtotal, v_fee, v_subtotal + v_fee, p_fresh_until,
          now() + case p_method
                    when 'qris'  then interval '15 minutes'
                    when 'va'    then interval '24 hours'
                    when 'tunai' then interval '3 days'
                    else interval '5 minutes' end)
  returning id into v_id;

  if p_method = 'saldo' then
    perform public.wallet_change(auth.uid(), -(v_subtotal + v_fee), 'pembayaran',
      format('Bayar %s %s (termasuk biaya layanan %s)', v_offer.fruit_type, public.fmt_kg(v_offer.quantity_kg), public.fmt_rupiah(v_fee)),
      v_id, p_offer_id);
    perform public.settle_payment(v_id);
  elsif p_method = 'tunai' then
    select coalesce(business_name, full_name) into v_umkm from public.profiles where id = auth.uid();
    insert into public.notifications (user_id, message, link)
    values (v_offer.petani_id,
            format('%s akan membayar tunai %s untuk %s %s. Konfirmasi setelah uangnya kamu terima.',
                   v_umkm, public.fmt_rupiah(v_subtotal), v_offer.fruit_type, public.fmt_kg(v_offer.quantity_kg)),
            '/dashboard/petani/riwayat');
  end if;

  return v_id;
end;
$$;

-- ---------- Simulator tidak boleh melunasi tagihan tunai ----------
create or replace function public.simulate_payment(p_payment_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if exists (select 1 from public.payments where id = p_payment_id and method = 'tunai') then
    raise exception 'Pembayaran tunai dikonfirmasi oleh petani, bukan lewat simulator';
  end if;
  perform public.settle_payment(p_payment_id);
end;
$$;

-- ---------- Petani mengonfirmasi uang tunai sudah diterima ----------
create or replace function public.confirm_cash_payment(p_payment_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.payments
     where id = p_payment_id and method = 'tunai' and payee_id = auth.uid() and status = 'menunggu'
  ) then
    raise exception 'Tagihan tunai tidak ditemukan';
  end if;
  perform public.settle_payment(p_payment_id);
end;
$$;

revoke execute on function public.confirm_cash_payment(uuid) from public, anon;
grant execute on function public.confirm_cash_payment(uuid) to authenticated;
revoke execute on function public.settle_payment(uuid) from public, anon, authenticated;
