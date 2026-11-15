import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PaymentMethod, UserRole } from "@/types/database";

export type ReportTransaction = {
  id: string;
  fruit_type: string;
  quantity_kg: number;
  price_per_kg: number;
  subtotal: number;
  service_fee: number;
  total_paid: number;
  payment_method: PaymentMethod | null;
  paid_at: string;
  /** nama UMKM (bagi petani) atau petani (bagi UMKM) */
  partner: string;
};

export type MonthlyRow = { month: string; transactions: number; kg: number; subtotal: number; fee: number; total: number };

export type FinanceReport = {
  transactions: ReportTransaction[];
  months: MonthlyRow[];
  totals: { transactions: number; kg: number; subtotal: number; fee: number; total: number };
};

const monthKey = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(iso));

/**
 * Laporan keuangan dari transaksi yang sudah lunas (status selesai).
 * Petani: pendapatan dari penjualan. UMKM: pengeluaran bahan baku + biaya layanan.
 */
export async function getFinanceReport(userId: string, role: UserRole): Promise<FinanceReport> {
  const supabase = await createClient();
  const partnerJoin =
    role === "petani"
      ? "partner:profiles!offers_accepted_by_fkey(full_name, business_name)"
      : "partner:profiles!offers_petani_id_fkey(full_name, business_name)";

  const { data } = await supabase
    .from("offers")
    .select(`id, fruit_type, quantity_kg, price_per_kg, subtotal, service_fee, total_paid, payment_method, paid_at, completed_at, ${partnerJoin}`)
    .eq(role === "petani" ? "petani_id" : "accepted_by", userId)
    .eq("status", "selesai")
    .order("paid_at", { ascending: false, nullsFirst: false });

  type Row = Omit<ReportTransaction, "partner" | "paid_at" | "subtotal" | "service_fee" | "total_paid"> & {
    subtotal: number | null;
    service_fee: number | null;
    total_paid: number | null;
    paid_at: string | null;
    completed_at: string | null;
    partner: { full_name: string; business_name: string | null } | null;
  };

  const transactions: ReportTransaction[] = ((data as unknown as Row[]) ?? []).map((row) => {
    const subtotal = row.subtotal ?? Math.round(Number(row.quantity_kg) * row.price_per_kg);
    const fee = row.service_fee ?? 0;
    return {
      id: row.id,
      fruit_type: row.fruit_type,
      quantity_kg: Number(row.quantity_kg),
      price_per_kg: row.price_per_kg,
      subtotal,
      service_fee: fee,
      total_paid: row.total_paid ?? subtotal + fee,
      payment_method: row.payment_method,
      paid_at: row.paid_at ?? row.completed_at ?? new Date().toISOString(),
      partner: row.partner?.business_name ?? row.partner?.full_name ?? "-",
    };
  });

  const byMonth = new Map<string, MonthlyRow>();
  for (const tx of transactions) {
    const key = monthKey(tx.paid_at);
    const row = byMonth.get(key) ?? { month: key, transactions: 0, kg: 0, subtotal: 0, fee: 0, total: 0 };
    row.transactions += 1;
    row.kg += tx.quantity_kg;
    row.subtotal += tx.subtotal;
    row.fee += tx.service_fee;
    row.total += tx.total_paid;
    byMonth.set(key, row);
  }

  const totals = transactions.reduce(
    (sum, tx) => ({
      transactions: sum.transactions + 1,
      kg: sum.kg + tx.quantity_kg,
      subtotal: sum.subtotal + tx.subtotal,
      fee: sum.fee + tx.service_fee,
      total: sum.total + tx.total_paid,
    }),
    { transactions: 0, kg: 0, subtotal: 0, fee: 0, total: 0 },
  );

  return { transactions, months: [...byMonth.values()], totals };
}
