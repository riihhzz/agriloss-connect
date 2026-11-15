import type { BankCode, OfferStatus, PaymentMethod, ProductCategory, Ripeness, UserRole, WalletTransactionType } from "@/types/database";

export const APP_NAME = "Agriloss.Connect";
export const APP_TAGLINE = "Petani Berdaya, UMKM Berkembang, Pangan Lebih Bermakna.";

/** Penjelasan singkat kegunaan platform (masukan Pak Agus: tampil di setiap halaman). */
export const VALUE_TAGLINE =
  "Pasar khusus hasil panen sisa musim & tidak lolos sortir — harga jauh di bawah pasar, masih layak diolah.";

/** Kriteria buah yang boleh ditawarkan di Agriloss.Connect. */
export const OFFER_CRITERIA = {
  allowed: [
    "Harga jauh di bawah harga pasar",
    "Masih layak diolah minimal 3 hari lagi",
    "Sisa musim, kelebihan panen, atau tidak lolos sortir (kecil, tergores, terlalu matang)",
  ],
  notAllowed: ["Buah premium yang baru dipanen dengan harga normal", "Buah yang sudah busuk atau berjamur"],
};

/** Batas minimal masa layak (hari). Di bawah ini hanya peringatan, bukan larangan. */
export const MIN_SHELF_LIFE_DAYS = 3;

export const PRODUCT_CATEGORY_LABEL: Record<ProductCategory, string> = {
  minuman: "Minuman & Es Krim",
  makanan_ringan: "Makanan Ringan",
  selai_olesan: "Selai & Olesan",
  kue_roti: "Kue, Roti & Puding",
  makanan_beku: "Makanan Beku",
  lainnya: "Lainnya",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  qris: "QRIS",
  va: "Virtual Account",
  saldo: "Saldo Agriloss",
  transfer: "Transfer Bank",
  tunai: "Tunai (COD)",
};

/** Bank untuk Virtual Account (simulasi) */
export const BANK_LABEL: Record<BankCode, string> = {
  bca: "BCA",
  bni: "BNI",
  bri: "BRI",
  mandiri: "Mandiri",
};

/** Tujuan tarik saldo (simulasi) */
export const WITHDRAW_TARGETS = ["BCA", "BNI", "BRI", "Mandiri", "BSI", "GoPay", "OVO", "DANA"] as const;
export const MIN_WITHDRAWAL = 10000;
export const TOPUP_PRESETS = [50000, 100000, 250000, 500000, 1000000];

export const WALLET_TX_LABEL: Record<WalletTransactionType, string> = {
  pemasukan: "Penjualan",
  isi_saldo: "Isi Saldo",
  pembayaran: "Pembayaran",
  penarikan: "Tarik Saldo",
};

/** Biaya layanan platform: 2% dari subtotal, maksimal Rp5.000 (sama dengan fungsi DB service_fee_for). */
export const SERVICE_FEE_RATE = 0.02;
export const SERVICE_FEE_MAX = 5000;

export const RIPENESS_LABEL: Record<Ripeness, string> = {
  mentah: "Mentah",
  setengah_matang: "Setengah Matang",
  matang: "Matang",
  sangat_matang: "Sangat Matang",
};

export const STATUS_LABEL: Record<OfferStatus, string> = {
  menawarkan: "Menawarkan",
  diterima: "Diterima",
  selesai: "Selesai",
  dibatalkan: "Ditarik",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  petani: "Petani Mitra Agriloss.Connect",
  umkm: "UMKM Mitra Agriloss.Connect",
};

export const DASHBOARD_HOME: Record<UserRole, string> = {
  petani: "/dashboard/petani",
  umkm: "/dashboard/umkm",
};

export type NavItem = { href: string; label: string };

export const PUBLIC_NAV: NavItem[] = [
  { href: "/", label: "Beranda" },
  { href: "/#tentang", label: "Tentang" },
  { href: "/mitra", label: "Mitra" },
  { href: "/katalog", label: "Katalog" },
];

export const DASHBOARD_NAV: Record<UserRole, NavItem[]> = {
  petani: [
    { href: "/dashboard/petani", label: "Beranda" },
    { href: "/dashboard/petani/penawaran", label: "Penawaran" },
    { href: "/dashboard/petani/riwayat", label: "Riwayat" },
    { href: "/dashboard/petani/laporan", label: "Laporan" },
    { href: "/dashboard/petani/saldo", label: "Saldo" },
  ],
  umkm: [
    { href: "/dashboard/umkm", label: "Beranda" },
    { href: "/dashboard/umkm/katalog", label: "Katalog" },
    { href: "/dashboard/umkm/penawaran", label: "Penawaran" },
    { href: "/dashboard/umkm/stok", label: "Stok" },
    { href: "/dashboard/umkm/laporan", label: "Laporan" },
    { href: "/dashboard/umkm/saldo", label: "Saldo" },
  ],
};

/** Daftar komoditas buah yang umum (bisa diketik bebas juga). */
export const FRUIT_SUGGESTIONS = [
  "Alpukat", "Apel", "Belimbing", "Jambu", "Jeruk", "Mangga", "Manggis", "Melon",
  "Nanas", "Pepaya", "Pisang", "Rambutan", "Salak", "Semangka", "Stroberi", "Tomat",
];

export const STORAGE_BUCKETS = {
  offers: "offer-photos",
  products: "product-images",
  avatars: "avatars",
} as const;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
