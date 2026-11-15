# Agriloss.Connect

> **Petani Berdaya, UMKM Berkembang, Pangan Lebih Bermakna.**

Agriloss.Connect adalah platform web yang menghubungkan **petani** dengan **UMKM pengolah pangan** untuk memanfaatkan hasil panen buah yang tidak terserap pasar (terlalu matang, tergores, atau tidak lolos sortir), sehingga **food loss** berkurang dan petani tetap mendapat penghasilan.

**Ini bukan marketplace buah biasa.** Yang dijual di sini khusus hasil panen sisa musim atau tidak lolos sortir, dengan harga **jauh di bawah harga pasar** dan **masih layak diolah minimal 3 hari**. Buah premium harga normal dan buah busuk tidak termasuk.

Demo: <https://agriloss-connect.vercel.app>

Karya untuk **Lomba Programming ISCOMFEST 2026**.

---

## Masalah & Solusi

Kajian Bappenas (2021) memperkirakan Indonesia kehilangan 23–48 juta ton pangan per tahun pada periode 2000–2019. Banyak buah yang sebenarnya masih layak olah terbuang karena petani tidak punya akses ke pembeli selain pasar segar.

Agriloss.Connect menyediakan:

| Peran | Yang bisa dilakukan |
|---|---|
| **Petani** | Menawarkan hasil panen (foto kondisi, jenis buah, kematangan, jumlah, harga jual, harga pasar pembanding, perkiraan masa layak), mengecek kondisi buah dengan AI, chat dengan UMKM, memantau progres penawaran, dan melihat laporan pendapatan |
| **UMKM** | Mencari bahan baku (urut terdekat, paling hemat, atau paling mendesak), bertanya ke petani lewat chat, menerima penawaran, mencatat pembayaran, mengelola stok bahan baku dan katalog produk olahan, membuat QR katalog, dan melihat laporan pengeluaran |
| **Publik** | Melihat statistik dampak, daftar UMKM mitra beserta lokasinya, dan katalog produk olahan dengan filter kategori, buah, harga, dan UMKM |

Semua komunikasi dan transaksi berlangsung **di dalam web**, tanpa aplikasi lain.

### Fitur utama

- **Ketentuan & peringatan otomatis.** Form penawaran menampilkan kriteria buah yang boleh dijual. Sistem memberi peringatan bila harga terlalu dekat dengan harga pasar atau masa layak kurang dari 3 hari, dan menampilkan lencana "Hemat X%" kepada UMKM.
- **Simulasi pembayaran.** UMKM membayar lewat **QRIS**, **Virtual Account** (BCA/BNI/BRI/Mandiri), **Saldo Agriloss**, atau **Tunai (COD)**. QRIS/VA membuat tagihan dengan batas waktu; QR-nya bisa dipindai dari HP untuk membuka simulator pembayaran, dan halaman tagihan berubah otomatis begitu lunas. Untuk COD, transaksi selesai setelah petani mengonfirmasi uang tunai diterima. Semua pembayaran adalah simulasi (tanpa uang sungguhan); di produksi, simulator digantikan payment gateway berizin.
- **Biaya layanan.** **2% dari nilai belanja, maksimal Rp5.000**, dibayar UMKM untuk pembayaran non-tunai. COD bebas biaya layanan. Petani selalu menerima harga penuh.
- **Saldo Agriloss.** Dompet digital di dalam platform: hasil penjualan petani masuk otomatis dan bisa ditarik ke bank/e-wallet; UMKM bisa isi saldo lalu membayar dengan saldo. Lengkap dengan riwayat mutasi.
- **Laporan keuangan.** Petani melihat pendapatan, UMKM melihat pengeluaran dan biaya layanan, lengkap dengan ringkasan bulanan dan tombol cetak/simpan PDF.
- **Chat real-time.** Petani dan UMKM berdiskusi per penawaran, dengan status terkirim/dibaca (Supabase Realtime).
- **AI (Google Gemini).**
  - *Cek Kondisi Buah*: petani mengunggah foto, AI memperkirakan jenis buah, kematangan, masa layak, dan saran olahan.
  - *Si Jeruk*: asisten yang menjawab pertanyaan pengguna dan mencari data nyata di platform (produk, penawaran, stok) sesuai hak akses pengguna.
- **Lokasi.** Pengguna menentukan titik lokasi lewat GPS atau menggeser pin di peta. Jarak petani ke UMKM dihitung otomatis.

### Alur penawaran

```
Petani kirim penawaran ──► [Menawarkan] ◄── UMKM boleh bertanya dulu lewat chat
                               │ UMKM klik "Terima"
                               ▼
                           [Diterima] ──► petani & UMKM berdiskusi lewat chat
                               │
                ┌──────────────┴──────────────┐
             "Bayar"                         "Batal"
     (QRIS / VA / Saldo / COD)                 │
                │                              ▼
     tagihan lunas (simulator,           [Menawarkan] (tersedia lagi untuk UMKM lain)
     saldo, atau konfirmasi petani)
                ▼
           [Selesai]
   • uang masuk ke Saldo Agriloss petani (kecuali COD)
   • otomatis masuk Stok UMKM
   • masuk Laporan Keuangan kedua pihak
   • dihitung sebagai "Food Loss Diselamatkan"
```

Petani juga dapat **menarik** penawaran yang belum diterima. Setiap perubahan status mengirim notifikasi ke petani.

---

## Teknologi

| Bagian | Teknologi |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server Components, Server Actions) + React 19 + TypeScript |
| Styling | Tailwind CSS v4, font Lexend (Google Fonts) |
| Backend & Database | [Supabase](https://supabase.com): PostgreSQL, Auth, Storage, Realtime, Row Level Security, fungsi RPC |
| AI | Google Gemini API (analisis foto dengan keluaran terstruktur, asisten dengan *function calling*) |
| Peta | Leaflet + react-leaflet dengan tile & geocoding **OpenStreetMap** (Nominatim), Geolocation API browser |
| QR Code | qrcode.react |
| Deploy | Vercel |

Desain UI/UX dibuat tim di Figma (high fidelity) dan Balsamiq (low fidelity). Maskot dan logo adalah karya orisinal tim.

---

## Struktur Folder

Kode dikelompokkan **per fitur** agar mudah dibaca: `app/` hanya berisi routing yang tipis, sedangkan logika ada di `features/`.

```
src/
├── app/                          # Routing (Next.js App Router)
│   ├── (public)/                 # Beranda, /katalog, /mitra, /mitra/[id] (tujuan QR)
│   ├── (auth)/                   # /masuk, /pilih-peran, /daftar/[role]
│   ├── dashboard/
│   │   ├── petani/               # beranda, penawaran, riwayat, chat, laporan, profil
│   │   └── umkm/                 # beranda, katalog, penawaran/[id], stok, chat, laporan, profil
│   ├── layout.tsx, error.tsx, not-found.tsx
├── features/                     # Logika per fitur
│   ├── auth/                     # actions (login/daftar/keluar) + form
│   ├── offers/                   # penawaran: queries, actions, kartu, form, panel keputusan
│   ├── products/                 # katalog produk UMKM + filter katalog publik
│   ├── chat/                     # percakapan petani dan UMKM (real-time)
│   ├── reports/                  # laporan keuangan
│   ├── ai/                       # cek kondisi buah & asisten Si Jeruk
│   ├── stock/                    # stok bahan baku & input pemakaian
│   ├── profile/                  # profil, pemilih lokasi (GPS/pin), QR katalog
│   ├── notifications/            # lonceng notifikasi
│   ├── stats/                    # statistik publik & dashboard
│   ├── landing/                  # hero, carousel "Tahukah kamu?", kartu mitra
│   └── dashboard/                # sapaan + statistik dashboard
├── components/
│   ├── ui/                       # Button, Field, Mascot, StatGroup, SearchBar, dll.
│   └── layout/                   # Navbar publik & dashboard, Footer
├── lib/
│   ├── supabase/                 # client browser, server, dan proxy (refresh sesi)
│   ├── ai/gemini.ts              # pemanggil Gemini (hanya di server) + pembatas laju
│   ├── auth.ts                   # getCurrentProfile, requireRole
│   ├── storage.ts                # validasi & upload gambar
│   ├── constants.ts, utils.ts
├── types/database.ts             # tipe tabel
└── proxy.ts                      # proteksi /dashboard (Next.js 16 "proxy")

supabase/
├── migrations/                   # skema, RLS, RPC, storage bucket
└── seed.sql                      # data demo
```

### Keamanan

- **Row Level Security** aktif di semua tabel. Petani hanya melihat penawarannya sendiri, UMKM hanya melihat penawaran terbuka atau yang ia terima, dan stok hanya bisa dilihat pemiliknya.
- Perubahan status penawaran dilakukan lewat **fungsi RPC di database** (`accept_offer`, `complete_offer`, `cancel_acceptance`, `withdraw_offer`, `record_stock_usage`) sehingga aturan bisnis tidak bisa dilewati dari browser.
- Setiap Server Action memeriksa ulang login dan peran (`requireRole`).
- Upload gambar divalidasi (JPG/PNG/WEBP, maks 5 MB) dan disimpan di folder milik user.
- **Chat**: hanya dua anggota percakapan yang bisa membaca dan mengirim pesan. Isi pesan tidak bisa diubah setelah terkirim (izin ubah dibatasi ke kolom status dibaca).
- **Saldo & pembayaran**: saldo, tagihan, dan mutasi hanya bisa dibaca pemiliknya dan hanya berubah lewat fungsi database (tidak bisa diubah langsung dari browser). Saldo tidak bisa negatif, dan satu tagihan tidak bisa dilunasi dua kali.
- **Nomor HP privat**: kolomnya tidak bisa dibaca pengguna lain maupun publik, hanya oleh pemiliknya.
- **Kunci Gemini** hanya dipakai di server dan tidak pernah dikirim ke browser. Pemanggilan AI dibatasi per pengguna, dan asisten membaca data memakai sesi pengguna sehingga RLS tetap berlaku.

---

## Menjalankan Secara Lokal

**Prasyarat:** Node.js 20+ dan akun Supabase (gratis).

```bash
# 1. Install dependensi
npm install

# 2. Siapkan environment
cp .env.example .env.local
#    isi NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
#    dan GEMINI_API_KEY (gratis dari https://aistudio.google.com/apikey)

# 3. Siapkan database (Supabase Dashboard → SQL Editor), jalankan berurutan:
#    supabase/migrations/0001_init.sql
#    supabase/migrations/0002_restrict_my_role.sql
#    supabase/migrations/0003_bimbingan_pak_agus.sql
#    supabase/migrations/0004_kunci_isi_pesan.sql
#    supabase/migrations/0005_nomor_hp_privat.sql
#    supabase/migrations/0006_pembayaran_saldo.sql
#    supabase/migrations/0007_bayar_tunai.sql
#    supabase/seed.sql            (opsional: data demo)

# 4. Jalankan
npm run dev        # http://localhost:3000
```

Perintah lain: `npm run build` (build produksi) dan `npm run lint` (cek kualitas kode).

> **Catatan Supabase:** agar pendaftaran langsung bisa dipakai tanpa verifikasi email, matikan
> *Authentication → Sign In / Providers → Email → Confirm email*.

### Akun Demo

Semua akun memakai password **`Demo12345`**.

| Peran | Email | Nama |
|---|---|---|
| Petani | `cecep@agriloss.demo` | Cecep Nurjaman (Ciwidey) |
| Petani | `ujang@agriloss.demo` | Ujang Supriatna (Lembang) |
| Petani | `siti@agriloss.demo` | Siti Aminah (Garut) |
| UMKM | `tiriz@agriloss.demo` | Tiriz.Co (Jatinangor) |
| UMKM | `esan@agriloss.demo` | Esan (Cipadung) |
| UMKM | `sariburah@agriloss.demo` | Sari Buah Lembang |

---

## Deploy ke Vercel

1. Push repository ke GitHub.
2. Import project di [vercel.com/new](https://vercel.com/new).
3. Tambahkan Environment Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `GEMINI_API_KEY`, dan `NEXT_PUBLIC_SITE_URL` (URL produksi, dipakai untuk QR katalog).
4. Deploy.

---

## Sumber & Atribusi

- Data food loss: Bappenas, *Laporan Kajian Food Loss and Waste di Indonesia* (2021).
- Peta & geocoding: © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, [Leaflet](https://leafletjs.com).
- AI: Google Gemini API.
- Library open source: Next.js, React, Tailwind CSS, Supabase JS, react-leaflet, qrcode.react (lihat `package.json`).
- Maskot, logo, dan desain UI: karya tim Agriloss.Connect.
- Penulisan kode dibantu asisten AI (Claude, Anthropic); ide, desain, dan pengujian dilakukan oleh tim.
