-- =====================================================================
-- 0008 — Statistik "Diterima UMKM" di dashboard petani
-- Sebelumnya hanya menghitung penawaran berstatus "diterima" (belum dibayar),
-- sehingga angkanya kembali 0 begitu UMKM membayar dan membingungkan petani.
-- Kini menghitung semua penawaran yang pernah diterima UMKM:
-- yang masih diproses (diterima) maupun yang sudah selesai.
-- =====================================================================

create or replace function public.get_my_stats()
returns table (stat_a bigint, stat_b bigint, saved_kg numeric)
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_role public.user_role;
begin
  select role into v_role from public.profiles where id = auth.uid();
  if v_role = 'petani' then
    -- stat_a: penawaran aktif, stat_b: total diterima UMKM (diterima + selesai), saved: kg selesai
    return query select
      (select count(*) from public.offers where petani_id = auth.uid() and status = 'menawarkan'),
      (select count(*) from public.offers where petani_id = auth.uid() and status in ('diterima', 'selesai')),
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
