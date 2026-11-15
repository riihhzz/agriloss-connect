-- =====================================================================
-- 0005 — Nomor HP bersifat privat
-- Tabel profiles terbaca publik (untuk halaman mitra & katalog), sehingga
-- kolom whatsapp ikut terbaca siapa pun lewat API. Karena komunikasi kini
-- lewat chat di dalam aplikasi, kolom itu dikunci: yang boleh dibaca umum
-- hanya kolom profil publik, dan pemilik membaca nomornya lewat my_phone().
-- =====================================================================

revoke select on public.profiles from anon, authenticated;
grant select (id, role, full_name, business_name, description, location, latitude, longitude, avatar_url, created_at)
  on public.profiles to anon, authenticated;

create or replace function public.my_phone()
returns text
language sql stable security definer set search_path = ''
as $$ select whatsapp from public.profiles where id = (select auth.uid()) $$;

revoke execute on function public.my_phone() from public, anon;
grant execute on function public.my_phone() to authenticated;

-- Salinan nomor di penawaran lama tidak lagi dipakai
update public.offers set whatsapp = '-' where whatsapp <> '-';
