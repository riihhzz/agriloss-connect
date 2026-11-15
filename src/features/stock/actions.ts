"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/database";

/** Catat pemakaian bahan baku (mengurangi sisa stok). */
export async function recordUsage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("umkm");
  const stockId = String(formData.get("stock_id") ?? "");
  const amount = Number(formData.get("amount_kg"));
  const note = String(formData.get("note") ?? "").trim();

  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, message: "Jumlah pemakaian harus lebih dari 0." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("record_stock_usage", {
    p_stock_id: stockId,
    p_amount: amount,
    p_note: note || null,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard/umkm/stok");
  return { ok: true, message: `Pemakaian ${amount} Kg tercatat.` };
}
