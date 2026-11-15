import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { OfferStatus, OfferWithPetani, OfferWithUmkm } from "@/types/database";

const PETANI_JOIN = "petani:profiles!offers_petani_id_fkey(id, full_name, business_name, location, latitude, longitude)";
const UMKM_JOIN = "umkm:profiles!offers_accepted_by_fkey(id, full_name, business_name, location)";

function likePattern(query: string) {
  return `%${query.replace(/[%_\\]/g, (char) => `\\${char}`)}%`;
}

/** Riwayat penawaran milik petani yang login (RLS membatasi ke miliknya). */
export async function getMyOffers(petaniId: string, { status, limit }: { status?: OfferStatus; limit?: number } = {}) {
  const supabase = await createClient();
  let request = supabase
    .from("offers")
    .select(`*, ${UMKM_JOIN}`)
    .eq("petani_id", petaniId)
    .order("created_at", { ascending: false });
  if (status) request = request.eq("status", status);
  if (limit) request = request.limit(limit);
  const { data } = await request;
  return (data as OfferWithUmkm[]) ?? [];
}

/** Penawaran terbuka untuk UMKM, bisa dicari per buah / lokasi. */
export async function getOpenOffers({ query, fruit, limit }: { query?: string; fruit?: string; limit?: number } = {}) {
  const supabase = await createClient();
  let request = supabase
    .from("offers")
    .select(`*, ${PETANI_JOIN}`)
    .eq("status", "menawarkan")
    .order("created_at", { ascending: false });
  if (query) request = request.or(`fruit_type.ilike.${likePattern(query)},location.ilike.${likePattern(query)}`);
  if (fruit) request = request.ilike("fruit_type", fruit);
  if (limit) request = request.limit(limit);
  const { data } = await request;
  return (data as OfferWithPetani[]) ?? [];
}

/** Penawaran yang sudah diterima UMKM ini dan menunggu keputusan Lanjutkan/Batal. */
export async function getPendingAcceptedOffers(umkmId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("offers")
    .select(`*, ${PETANI_JOIN}`)
    .eq("accepted_by", umkmId)
    .eq("status", "diterima")
    .order("accepted_at", { ascending: false });
  return (data as OfferWithPetani[]) ?? [];
}

export async function getOfferDetail(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("offers").select(`*, ${PETANI_JOIN}`).eq("id", id).maybeSingle();
  return (data as OfferWithPetani) ?? null;
}

/** Jenis buah yang sedang ditawarkan (untuk opsi filter). */
export async function getOpenFruitTypes() {
  const supabase = await createClient();
  const { data } = await supabase.from("offers").select("fruit_type").eq("status", "menawarkan");
  return [...new Set((data ?? []).map((row) => row.fruit_type as string))].sort();
}
