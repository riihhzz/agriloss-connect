"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/database";

const BANKS = ["bca", "bni", "bri", "mandiri"];
const UUID = /^[0-9a-f-]{36}$/i;

function revalidateMoney() {
  revalidatePath("/dashboard", "layout");
}

/** Pesan error dari fungsi database, tanpa awalan teknis. */
function friendly(message: string | undefined) {
  return message?.replace(/^.*?ERROR:\s*/i, "") || "Terjadi kesalahan. Coba lagi.";
}

/**
 * UMKM membayar penawaran yang sudah ia terima.
 * QRIS / Virtual Account: tagihan dibuat lalu diarahkan ke halaman pembayaran.
 * Saldo Agriloss: langsung terpotong dan transaksi selesai.
 */
export async function payOffer(formData: FormData): Promise<ActionState> {
  await requireRole("umkm");
  const offerId = String(formData.get("id") ?? "");
  const method = String(formData.get("payment_method") ?? "");
  const bank = String(formData.get("bank") ?? "") || null;
  const freshUntil = String(formData.get("fresh_until") ?? "") || null;

  if (!UUID.test(offerId)) return { ok: false, message: "Penawaran tidak valid." };
  if (!["qris", "va", "saldo", "tunai"].includes(method)) return { ok: false, message: "Pilih metode pembayaran terlebih dahulu." };
  if (method === "va" && (!bank || !BANKS.includes(bank))) return { ok: false, message: "Pilih bank untuk Virtual Account." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_payment", {
    p_offer_id: offerId,
    p_method: method,
    p_bank: method === "va" ? bank : null,
    p_fresh_until: freshUntil,
  });
  if (error) return { ok: false, message: friendly(error.message) };

  revalidateMoney();
  if (method === "saldo") redirect("/dashboard/umkm/stok?baru=1");
  redirect(`/dashboard/umkm/pembayaran/${data}`);
}

/** Isi Saldo Agriloss lewat QRIS / Virtual Account (simulasi). */
export async function topUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("umkm");
  const amount = Number(String(formData.get("amount") ?? "").replace(/\D/g, ""));
  const method = String(formData.get("payment_method") ?? "");
  const bank = String(formData.get("bank") ?? "") || null;

  if (!Number.isInteger(amount) || amount < 10000 || amount > 10000000) {
    return { ok: false, message: "Nominal isi saldo antara Rp10.000 dan Rp10.000.000." };
  }
  if (!["qris", "va"].includes(method)) return { ok: false, message: "Pilih metode pembayaran." };
  if (method === "va" && (!bank || !BANKS.includes(bank))) return { ok: false, message: "Pilih bank untuk Virtual Account." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_topup", { p_amount: amount, p_method: method, p_bank: method === "va" ? bank : null });
  if (error) return { ok: false, message: friendly(error.message) };
  redirect(`/dashboard/umkm/pembayaran/${data}`);
}

export async function cancelPayment(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/masuk");
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;
  const supabase = await createClient();
  await supabase.rpc("cancel_payment", { p_payment_id: id });
  revalidateMoney();
}

/**
 * Simulator gateway: menandai tagihan lunas, seperti notifikasi dari payment gateway.
 * Sengaja bisa dipanggil tanpa login (dibuka dari HP lewat pemindaian QR).
 */
export async function simulatePayment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return { ok: false, message: "Tagihan tidak valid." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("simulate_payment", { p_payment_id: id });
  if (error) return { ok: false, message: friendly(error.message) };
  revalidateMoney();
  return { ok: true, message: "Pembayaran berhasil." };
}

/** Tarik Saldo Agriloss ke rekening bank / e-wallet (simulasi: langsung berhasil). */
export async function withdraw(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/masuk");
  const amount = Number(String(formData.get("amount") ?? "").replace(/\D/g, ""));
  const bank = String(formData.get("bank") ?? "").trim();
  const accountNumber = String(formData.get("account_number") ?? "").replace(/[\s-]/g, "");
  const accountName = String(formData.get("account_name") ?? "").trim();

  if (!Number.isInteger(amount) || amount < 10000) return { ok: false, message: "Minimal penarikan Rp10.000." };
  if (!bank) return { ok: false, message: "Pilih bank atau e-wallet tujuan." };
  if (!/^\d{8,20}$/.test(accountNumber)) return { ok: false, message: "Nomor rekening / e-wallet harus 8–20 digit angka." };
  if (accountName.length < 3) return { ok: false, message: "Nama pemilik rekening wajib diisi." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("request_withdrawal", {
    p_amount: amount,
    p_bank: bank,
    p_account_number: accountNumber,
    p_account_name: accountName,
  });
  if (error) return { ok: false, message: friendly(error.message) };

  revalidateMoney();
  return { ok: true, message: `Penarikan ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount)} ke ${bank} berhasil diproses.` };
}

/** Petani mengonfirmasi uang tunai (COD) dari UMKM sudah diterima. */
export async function confirmCashPayment(formData: FormData) {
  await requireRole("petani");
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;
  const supabase = await createClient();
  await supabase.rpc("confirm_cash_payment", { p_payment_id: id });
  revalidateMoney();
}
