import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Stock } from "@/types/database";

export async function getMyStocks(umkmId: string, { onlyRemaining = false } = {}): Promise<Stock[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stocks")
    .select("*")
    .eq("umkm_id", umkmId)
    .order("created_at", { ascending: false });

  const stocks = ((data as Stock[]) ?? []).map((stock) => ({
    ...stock,
    quantity_kg: Number(stock.quantity_kg),
    used_kg: Number(stock.used_kg),
  }));
  return onlyRemaining ? stocks.filter((stock) => stock.used_kg < stock.quantity_kg) : stocks;
}
