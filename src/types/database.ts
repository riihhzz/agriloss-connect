// Tipe tabel Supabase (selaras dengan supabase/migrations/0001_init.sql)

export type UserRole = "petani" | "umkm";
export type OfferStatus = "menawarkan" | "diterima" | "selesai" | "dibatalkan";
export type Ripeness = "mentah" | "setengah_matang" | "matang" | "sangat_matang";
export type ProductCategory = "minuman" | "makanan_ringan" | "selai_olesan" | "kue_roti" | "makanan_beku" | "lainnya";
/** qris/va/saldo: metode aktif. transfer/tunai: hanya data transaksi lama. */
export type PaymentMethod = "qris" | "va" | "saldo" | "transfer" | "tunai";
export type BankCode = "bca" | "bni" | "bri" | "mandiri";

/** Kolom profil yang boleh dibaca semua orang. Nomor HP (whatsapp) sengaja tidak termasuk. */
export const PROFILE_PUBLIC_COLUMNS =
  "id, role, full_name, business_name, description, location, latitude, longitude, avatar_url, created_at";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  business_name: string | null;
  description: string | null;
  /** Hanya terisi untuk profil milik sendiri (lewat RPC my_phone) */
  whatsapp: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Offer {
  id: string;
  petani_id: string;
  fruit_type: string;
  ripeness: Ripeness;
  quantity_kg: number;
  price_per_kg: number;
  location: string;
  whatsapp: string;
  notes: string | null;
  photo_url: string | null;
  status: OfferStatus;
  accepted_by: string | null;
  accepted_at: string | null;
  completed_at: string | null;
  created_at: string;
  /** Harga pasar normal per Kg (pembanding agar terlihat hematnya) */
  market_price_per_kg: number | null;
  /** Perkiraan berapa hari lagi buah masih layak diolah */
  shelf_life_days: number | null;
  payment_method: PaymentMethod | null;
  subtotal: number | null;
  service_fee: number | null;
  total_paid: number | null;
  paid_at: string | null;
}

export interface Product {
  id: string;
  umkm_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  category: ProductCategory;
  /** Buah bahan baku, mis. "Mangga" */
  fruit: string | null;
}

export interface Stock {
  id: string;
  umkm_id: string;
  offer_id: string | null;
  petani_name: string;
  fruit_type: string;
  quantity_kg: number;
  used_kg: number;
  fresh_until: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  offer_id: string;
  petani_id: string;
  umkm_id: string;
  last_message_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

/** Ringkasan profil yang di-join ke tabel lain */
export type ProfileSummary = Pick<Profile, "id" | "full_name" | "business_name" | "location"> &
  Partial<Pick<Profile, "latitude" | "longitude">>;

export type OfferWithPetani = Offer & { petani: ProfileSummary | null };
export type OfferWithUmkm = Offer & { umkm: ProfileSummary | null };
export type ProductWithUmkm = Product & { umkm: ProfileSummary | null };

/** Hasil standar Server Action untuk ditampilkan di form */
export type ActionState = { ok: boolean; message: string } | null;

// ───────── Pembayaran (simulasi) & Saldo ─────────

export type PaymentStatus = "menunggu" | "berhasil" | "dibatalkan";

export interface Payment {
  id: string;
  kind: "transaksi" | "isi_saldo";
  payer_id: string;
  payee_id: string | null;
  offer_id: string | null;
  method: "qris" | "va" | "saldo" | "tunai";
  bank: BankCode | null;
  va_number: string | null;
  subtotal: number;
  service_fee: number;
  amount: number;
  fresh_until: string | null;
  status: PaymentStatus;
  expires_at: string;
  paid_at: string | null;
  created_at: string;
}

export type WalletTransactionType = "pemasukan" | "isi_saldo" | "pembayaran" | "penarikan";

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  amount: number;
  balance_after: number;
  description: string;
  offer_id: string | null;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  amount: number;
  bank: string;
  account_number: string;
  account_name: string;
  status: "diproses" | "berhasil" | "gagal";
  created_at: string;
}
