/** Gabungkan className, abaikan nilai falsy. */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

export function formatRupiah(value: number) {
  // Spasi tak-terputus: "Rp" dan angka tidak pernah terpisah ke baris berbeda
  return rupiah.format(value).replace(/\s/g, String.fromCharCode(160));
}

export function formatNumber(value: number) {
  return number.format(value);
}

export function formatKg(value: number) {
  return `${number.format(value)} Kg`;
}

export function formatDate(value: string | Date, withTime = false) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

/** Biaya layanan platform: 2% dari subtotal, maksimal Rp5.000 (selaras dengan DB). */
export function serviceFee(subtotal: number) {
  return Math.min(Math.round(subtotal * 0.02), 5000);
}

/** Persentase hemat dibanding harga pasar, mis. 65 (%). null bila tidak ada pembanding. */
export function savingsPercent(price: number, marketPrice: number | null | undefined) {
  if (!marketPrice || marketPrice <= price) return null;
  return Math.round(((marketPrice - price) / marketPrice) * 100);
}

/** Jarak dua koordinat dalam km (rumus haversine). */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Tanggal N hari dari sekarang dalam format input date (YYYY-MM-DD). */
export function dateFromToday(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Nama yang ditampilkan: nama usaha untuk UMKM, nama lengkap untuk petani. */
export function displayName(profile: { full_name: string; business_name: string | null } | null) {
  if (!profile) return "-";
  return profile.business_name ?? profile.full_name;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}
