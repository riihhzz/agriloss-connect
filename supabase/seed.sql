-- =====================================================================
-- Data demo AgriLoss.Connect (untuk penjurian & video demo)
-- Semua akun memakai password: Demo12345
-- =====================================================================
do $$
declare
  v_pw text := extensions.crypt('Demo12345', extensions.gen_salt('bf'));
  v_users jsonb := '[
    {"email":"cecep@agriloss.demo","meta":{"role":"petani","full_name":"Cecep Nurjaman","whatsapp":"081234567801","location":"Ciwidey, Bandung"},"lat":-7.1003,"lng":107.4492},
    {"email":"ujang@agriloss.demo","meta":{"role":"petani","full_name":"Ujang Supriatna","whatsapp":"081234567802","location":"Lembang, Bandung Barat"},"lat":-6.8117,"lng":107.6178},
    {"email":"siti@agriloss.demo","meta":{"role":"petani","full_name":"Siti Aminah","whatsapp":"081234567803","location":"Cikajang, Garut"},"lat":-7.3689,"lng":107.8028},
    {"email":"tiriz@agriloss.demo","meta":{"role":"umkm","full_name":"Graha Pratama","business_name":"Tiriz.Co","whatsapp":"081234567811","location":"Jatinangor, Sumedang"},"lat":-6.9302,"lng":107.7741,"desc":"Es krim dan minuman segar dari buah lokal yang tidak lolos sortir pasar."},
    {"email":"esan@agriloss.demo","meta":{"role":"umkm","full_name":"Esa Nuraini","business_name":"Esan","whatsapp":"081234567812","location":"Cipadung, Bandung"},"lat":-6.9283,"lng":107.7172,"desc":"Selai, jus, dan puding buah rumahan tanpa pengawet."},
    {"email":"sariburah@agriloss.demo","meta":{"role":"umkm","full_name":"Rina Kartika","business_name":"Sari Buah Lembang","whatsapp":"081234567813","location":"Lembang, Bandung Barat"},"lat":-6.8117,"lng":107.6178,"desc":"Keripik dan manisan buah khas Lembang."}
  ]';
  v_item jsonb;
  v_id uuid;
  v_cecep uuid; v_ujang uuid; v_siti uuid;
  v_tiriz uuid; v_esan uuid; v_sari uuid;
  v_offer uuid;
begin
  for v_item in select * from jsonb_array_elements(v_users) loop
    -- lewati jika akun sudah ada (seed bisa dijalankan ulang)
    v_id := null;
    select id into v_id from auth.users where email = v_item->>'email';
    if v_id is null then
      v_id := gen_random_uuid();
      insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                              raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                              confirmation_token, email_change, email_change_token_new, recovery_token)
      values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_item->>'email', v_pw, now(),
              '{"provider":"email","providers":["email"]}', v_item->'meta', now() - interval '10 days', now(),
              '', '', '', '');
      insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      values (gen_random_uuid(), v_id, v_id::text,
              jsonb_build_object('sub', v_id::text, 'email', v_item->>'email', 'email_verified', true),
              'email', now(), now(), now());
    end if;
    update public.profiles
       set latitude = (v_item->>'lat')::float8, longitude = (v_item->>'lng')::float8,
           description = v_item->>'desc', created_at = now() - interval '10 days'
     where id = v_id;
  end loop;

  select id into v_cecep from auth.users where email = 'cecep@agriloss.demo';
  select id into v_ujang from auth.users where email = 'ujang@agriloss.demo';
  select id into v_siti  from auth.users where email = 'siti@agriloss.demo';
  select id into v_tiriz from auth.users where email = 'tiriz@agriloss.demo';
  select id into v_esan  from auth.users where email = 'esan@agriloss.demo';
  select id into v_sari  from auth.users where email = 'sariburah@agriloss.demo';

  -- Data transaksi hanya diisi sekali
  if exists (select 1 from public.products) then
    return;
  end if;

  insert into public.products (umkm_id, name, description, price, is_available) values
    (v_tiriz, 'Es Krim Melon',      'Es krim lembut dari melon Ciwidey.',         15000, true),
    (v_tiriz, 'Es Krim Stroberi',   'Stroberi Lembang yang terlalu matang untuk pasar, tetap manis.', 15000, true),
    (v_tiriz, 'Smoothie Mangga',    'Mangga harum manis, tanpa gula tambahan.',   18000, true),
    (v_esan,  'Selai Stroberi',     'Selai rumahan 250 gr.',                      25000, true),
    (v_esan,  'Jus Jeruk Garut',    'Jeruk Garut peras segar 350 ml.',            12000, true),
    (v_esan,  'Puding Mangga',      'Puding lembut dengan potongan mangga.',      10000, true),
    (v_sari,  'Keripik Nangka',     'Keripik vakum renyah 100 gr.',               20000, true),
    (v_sari,  'Manisan Pepaya',     'Manisan kering khas Lembang.',               17000, true),
    (v_sari,  'Keripik Apel',       'Apel lokal diolah jadi keripik sehat.',      22000, false);

  -- Penawaran terbuka
  insert into public.offers (petani_id, fruit_type, ripeness, quantity_kg, price_per_kg, location, whatsapp, notes, created_at) values
    (v_cecep, 'Melon',    'matang',          40, 12000, 'Ciwidey, Bandung',       '081234567801', 'Kulit sedikit retak, daging buah manis.', now() - interval '1 day'),
    (v_ujang, 'Stroberi', 'sangat_matang',   25, 20000, 'Lembang, Bandung Barat', '081234567802', 'Ukuran kecil, tidak lolos grade A.',      now() - interval '6 hours'),
    (v_siti,  'Jeruk',    'matang',          60,  8000, 'Cikajang, Garut',        '081234567803', null,                                       now() - interval '3 hours'),
    (v_cecep, 'Tomat',    'setengah_matang', 30,  6000, 'Ciwidey, Bandung',       '081234567801', 'Bentuk tidak seragam.',                     now() - interval '2 days');

  -- Diterima Tiriz.Co, menunggu keputusan Lanjutkan/Batal
  insert into public.offers (petani_id, fruit_type, ripeness, quantity_kg, price_per_kg, location, whatsapp, status, accepted_by, accepted_at, created_at)
  values (v_ujang, 'Mangga', 'matang', 35, 14000, 'Lembang, Bandung Barat', '081234567802', 'diterima', v_tiriz, now() - interval '2 hours', now() - interval '1 day');

  -- Transaksi selesai + stok otomatis
  insert into public.offers (petani_id, fruit_type, ripeness, quantity_kg, price_per_kg, location, whatsapp, status, accepted_by, accepted_at, completed_at, created_at)
  values (v_cecep, 'Melon', 'sangat_matang', 50, 10000, 'Ciwidey, Bandung', '081234567801', 'selesai', v_tiriz, now() - interval '4 days', now() - interval '3 days', now() - interval '5 days')
  returning id into v_offer;
  insert into public.stocks (umkm_id, offer_id, petani_name, fruit_type, quantity_kg, used_kg, fresh_until, created_at)
  values (v_tiriz, v_offer, 'Cecep Nurjaman', 'Melon', 50, 20, (now() + interval '2 days')::date, now() - interval '3 days');

  insert into public.offers (petani_id, fruit_type, ripeness, quantity_kg, price_per_kg, location, whatsapp, status, accepted_by, accepted_at, completed_at, created_at)
  values (v_siti, 'Jeruk', 'matang', 40, 7000, 'Cikajang, Garut', '081234567803', 'selesai', v_esan, now() - interval '6 days', now() - interval '5 days', now() - interval '7 days')
  returning id into v_offer;
  insert into public.stocks (umkm_id, offer_id, petani_name, fruit_type, quantity_kg, used_kg, fresh_until, created_at)
  values (v_esan, v_offer, 'Siti Aminah', 'Jeruk', 40, 32, (now() + interval '1 day')::date, now() - interval '5 days');

  insert into public.offers (petani_id, fruit_type, ripeness, quantity_kg, price_per_kg, location, whatsapp, status, accepted_by, accepted_at, completed_at, created_at)
  values (v_ujang, 'Stroberi', 'sangat_matang', 20, 18000, 'Lembang, Bandung Barat', '081234567802', 'selesai', v_tiriz, now() - interval '8 days', now() - interval '7 days', now() - interval '9 days')
  returning id into v_offer;
  insert into public.stocks (umkm_id, offer_id, petani_name, fruit_type, quantity_kg, used_kg, fresh_until, created_at)
  values (v_tiriz, v_offer, 'Ujang Supriatna', 'Stroberi', 20, 20, (now() - interval '1 day')::date, now() - interval '7 days');

  insert into public.notifications (user_id, message, link, created_at) values
    (v_ujang, 'Penawaran Mangga 35 kg diterima oleh Tiriz.Co', '/dashboard/petani/riwayat', now() - interval '2 hours'),
    (v_cecep, 'Transaksi Melon 50 kg selesai. Terima kasih telah mengurangi food loss!', '/dashboard/petani/riwayat', now() - interval '3 days');
end $$;

-- =====================================================================
-- Pelengkap data demo untuk kolom dari migrasi 0003 (aman dijalankan ulang)
-- =====================================================================

-- Harga pasar & perkiraan masa layak penawaran demo
update public.offers o
   set market_price_per_kg = coalesce(o.market_price_per_kg, o.price_per_kg * 3),
       shelf_life_days = coalesce(o.shelf_life_days, 4)
  from auth.users u
 where u.id = o.petani_id and u.email like '%@agriloss.demo';

-- Pembayaran untuk transaksi demo yang sudah selesai
update public.offers o
   set subtotal = round(o.quantity_kg * o.price_per_kg)::integer,
       service_fee = public.service_fee_for(round(o.quantity_kg * o.price_per_kg)::integer),
       total_paid = round(o.quantity_kg * o.price_per_kg)::integer + public.service_fee_for(round(o.quantity_kg * o.price_per_kg)::integer),
       payment_method = coalesce(o.payment_method, 'qris'),
       paid_at = coalesce(o.paid_at, o.completed_at)
  from auth.users u
 where u.id = o.petani_id and u.email like '%@agriloss.demo' and o.status = 'selesai' and o.subtotal is null;

-- Kategori & buah bahan baku produk demo
update public.products p
   set category = v.category, fruit = v.fruit
  from (values
    ('Es Krim Melon', 'minuman', 'Melon'), ('Es Krim Stroberi', 'minuman', 'Stroberi'),
    ('Smoothie Mangga', 'minuman', 'Mangga'), ('Selai Stroberi', 'selai_olesan', 'Stroberi'),
    ('Jus Jeruk Garut', 'minuman', 'Jeruk'), ('Puding Mangga', 'kue_roti', 'Mangga'),
    ('Keripik Nangka', 'makanan_ringan', 'Nangka'), ('Manisan Pepaya', 'makanan_ringan', 'Pepaya'),
    ('Keripik Apel', 'makanan_ringan', 'Apel')
  ) as v(name, category, fruit), auth.users u
 where p.name = v.name and u.id = p.umkm_id and u.email like '%@agriloss.demo';

-- Percakapan untuk penawaran yang sudah diterima/selesai
insert into public.conversations (offer_id, petani_id, umkm_id)
select id, petani_id, accepted_by from public.offers
 where accepted_by is not null
on conflict (offer_id, umkm_id) do nothing;

-- Contoh isi chat untuk penawaran Mangga (Ujang ↔ Tiriz.Co)
insert into public.messages (conversation_id, sender_id, body, created_at)
select c.id, m.sender, m.body, now() - m.ago
  from public.conversations c
  join public.offers o on o.id = c.offer_id and o.fruit_type = 'Mangga' and o.status = 'diterima'
  cross join lateral (values
    (c.umkm_id,   'Halo Pak Ujang, kami dari Tiriz.Co. Mangganya masih ada 35 kg ya?', interval '110 minutes'),
    (c.petani_id, 'Masih, Kak. Matang semua, kira-kira masih bagus 4 hari lagi.',      interval '100 minutes'),
    (c.umkm_id,   'Siap Pak, kami ambil semua. Besok pagi kami jemput ke Lembang.',    interval '95 minutes')
  ) as m(sender, body, ago)
 where not exists (select 1 from public.messages x where x.conversation_id = c.id);

-- Percakapan tanpa pesan diurutkan menurut waktu penawaran, bukan waktu seed dijalankan
update public.conversations c
   set last_message_at = o.created_at
  from public.offers o
 where o.id = c.offer_id
   and not exists (select 1 from public.messages m where m.conversation_id = c.id);
