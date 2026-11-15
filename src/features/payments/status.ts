/** Tagihan dianggap kedaluwarsa bila masih menunggu tetapi batas waktunya sudah lewat. */
export function isPaymentExpired(payment: { status: string; expires_at: string }) {
  return payment.status === "menunggu" && new Date(payment.expires_at).getTime() < Date.now();
}

/** Sisa detik sebelum tagihan kedaluwarsa, dihitung dengan jam server (bukan jam perangkat pengguna). */
export function secondsUntil(expiresAt: string) {
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}
