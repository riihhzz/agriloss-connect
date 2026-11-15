-- =====================================================================
-- 0004 — Kunci isi pesan chat
-- Kebijakan "members mark messages read" mengizinkan penerima meng-UPDATE
-- baris pesan lawan bicaranya. Tanpa pembatasan kolom, isi pesan (body)
-- ikut bisa diubah. Di sini izin UPDATE dibatasi hanya untuk kolom read_at,
-- sehingga pesan yang sudah terkirim tidak bisa diubah siapa pun.
-- =====================================================================

revoke update on public.messages from anon, authenticated;
grant update (read_at) on public.messages to authenticated;

-- Percakapan hanya dibuat/diubah lewat fungsi (start_conversation, accept_offer, trigger)
revoke insert, update, delete on public.conversations from anon, authenticated;
revoke delete on public.messages from anon, authenticated;
