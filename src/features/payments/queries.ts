import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Payment, WalletTransaction, Withdrawal } from "@/types/database";

/** Tagihan milik user (RLS: hanya pembayar atau penerima). */
export async function getPayment(id: string): Promise<(Payment & { offer: { fruit_type: string; quantity_kg: number } | null }) | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("payments").select("*, offer:offers(fruit_type, quantity_kg)").eq("id", id).maybeSingle();
  return (data as (Payment & { offer: { fruit_type: string; quantity_kg: number } | null }) | null) ?? null;
}

/** Tagihan yang masih menunggu untuk satu penawaran (dan belum kedaluwarsa). */
export async function getPendingPaymentForOffer(offerId: string): Promise<Payment | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("offer_id", offerId)
    .eq("status", "menunggu")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as Payment | null) ?? null;
}

export async function getBalance(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.from("wallets").select("balance").eq("user_id", userId).maybeSingle();
  return Number(data?.balance ?? 0);
}

export type WalletOverview = {
  balance: number;
  transactions: WalletTransaction[];
  withdrawals: Withdrawal[];
  /** total uang masuk & keluar (seluruh riwayat yang dimuat) */
  totalIn: number;
  totalOut: number;
};

export async function getWallet(userId: string): Promise<WalletOverview> {
  const supabase = await createClient();
  const [balance, { data: transactions }, { data: withdrawals }] = await Promise.all([
    getBalance(userId),
    supabase.from("wallet_transactions").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("withdrawals").select("*").order("created_at", { ascending: false }).limit(20),
  ]);
  const rows = (transactions as WalletTransaction[] | null) ?? [];
  return {
    balance,
    transactions: rows,
    withdrawals: (withdrawals as Withdrawal[] | null) ?? [],
    totalIn: rows.filter((row) => row.amount > 0).reduce((sum, row) => sum + row.amount, 0),
    totalOut: rows.filter((row) => row.amount < 0).reduce((sum, row) => sum - row.amount, 0),
  };
}

export type SimulatorPayment = {
  id: string;
  kind: Payment["kind"];
  method: Payment["method"];
  bank: Payment["bank"];
  va_number: string | null;
  amount: number;
  status: Payment["status"];
  expires_at: string;
  merchant: string;
  description: string;
};

/** Data tagihan untuk halaman simulator (bisa dibuka tanpa login). */
export async function getSimulatorPayment(id: string): Promise<SimulatorPayment | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_payment_for_simulator", { p_payment_id: id });
  const row = Array.isArray(data) ? data[0] : null;
  return (row as SimulatorPayment | undefined) ?? null;
}

export type PendingCashPayment = Payment & {
  offer: { fruit_type: string; quantity_kg: number } | null;
  payer: { full_name: string; business_name: string | null } | null;
};

/** Tagihan tunai yang menunggu konfirmasi petani (uang sudah diterima atau belum). */
export async function getPendingCashPayments(userId: string): Promise<PendingCashPayment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("*, offer:offers(fruit_type, quantity_kg), payer:profiles!payments_payer_id_fkey(full_name, business_name)")
    .eq("payee_id", userId)
    .eq("method", "tunai")
    .eq("status", "menunggu")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  return (data as PendingCashPayment[] | null) ?? [];
}
