import "server-only";
import { createClient } from "@/lib/supabase/server";

export type PublicStats = { petaniCount: number; umkmCount: number; savedKg: number };
export type MyStats = { statA: number; statB: number; savedKg: number };

export async function getPublicStats(): Promise<PublicStats> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_public_stats").single<{ petani_count: number; umkm_count: number; saved_kg: number }>();
  return {
    petaniCount: Number(data?.petani_count ?? 0),
    umkmCount: Number(data?.umkm_count ?? 0),
    savedKg: Number(data?.saved_kg ?? 0),
  };
}

/** Petani: aktif / diterima / kg selesai. UMKM: produk / penawaran tersedia / kg selesai. */
export async function getMyStats(): Promise<MyStats> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_my_stats").single<{ stat_a: number; stat_b: number; saved_kg: number }>();
  return {
    statA: Number(data?.stat_a ?? 0),
    statB: Number(data?.stat_b ?? 0),
    savedKg: Number(data?.saved_kg ?? 0),
  };
}
