import "server-only";
import { createClient } from "@/lib/supabase/server";
import { PROFILE_PUBLIC_COLUMNS, type Product, type ProductCategory, type ProductWithUmkm, type Profile } from "@/types/database";

const UMKM_JOIN = "umkm:profiles!products_umkm_id_fkey(id, full_name, business_name, location)";

/** Escape karakter wildcard agar input pengguna diperlakukan sebagai teks biasa. */
function likePattern(query: string) {
  return `%${query.replace(/[%_\\]/g, (char) => `\\${char}`)}%`;
}

export type ProductSort = "terbaru" | "termurah" | "termahal";

export type ProductFilters = {
  query?: string;
  umkmId?: string;
  category?: ProductCategory;
  fruit?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  onlyAvailable?: boolean;
  limit?: number;
};

export async function getPublicProducts({
  query,
  umkmId,
  category,
  fruit,
  minPrice,
  maxPrice,
  sort = "terbaru",
  onlyAvailable = true,
  limit,
}: ProductFilters = {}): Promise<ProductWithUmkm[]> {
  const supabase = await createClient();
  let request = supabase.from("products").select(`*, ${UMKM_JOIN}`);

  if (onlyAvailable) request = request.eq("is_available", true);
  if (umkmId) request = request.eq("umkm_id", umkmId);
  if (category) request = request.eq("category", category);
  if (fruit) request = request.ilike("fruit", fruit);
  if (minPrice !== undefined) request = request.gte("price", minPrice);
  if (maxPrice !== undefined) request = request.lte("price", maxPrice);
  if (query) {
    const pattern = likePattern(query);
    request = request.or(`name.ilike.${pattern},description.ilike.${pattern},fruit.ilike.${pattern}`);
  }

  request =
    sort === "termurah"
      ? request.order("price", { ascending: true })
      : sort === "termahal"
        ? request.order("price", { ascending: false })
        : request.order("created_at", { ascending: false });
  if (limit) request = request.limit(limit);

  const { data } = await request;
  return (data as ProductWithUmkm[]) ?? [];
}

/** Daftar buah bahan baku yang ada di katalog (untuk opsi filter). */
export async function getProductFruits(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("fruit").eq("is_available", true).not("fruit", "is", null);
  return [...new Set((data ?? []).map((row) => row.fruit as string))].sort();
}

export async function getMyProducts(umkmId: string, query?: string): Promise<Product[]> {
  const supabase = await createClient();
  let request = supabase.from("products").select("*").eq("umkm_id", umkmId).order("created_at", { ascending: false });
  if (query) request = request.ilike("name", likePattern(query));
  const { data } = await request;
  return (data as Product[]) ?? [];
}

export async function getProduct(id: string, umkmId: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("*").eq("id", id).eq("umkm_id", umkmId).maybeSingle();
  return (data as Product) ?? null;
}

export type UmkmPartner = Profile & { product_count: number };

/** Daftar UMKM mitra beserta jumlah produknya. */
export async function getUmkmPartners(limit?: number): Promise<UmkmPartner[]> {
  const supabase = await createClient();
  let request = supabase
    .from("profiles")
    .select(`${PROFILE_PUBLIC_COLUMNS}, products(count)`)
    .eq("role", "umkm")
    .order("created_at", { ascending: true });
  if (limit) request = request.limit(limit);

  const { data } = await request;
  return ((data ?? []) as unknown as Array<Omit<Profile, "whatsapp"> & { products: { count: number }[] }>).map(({ products, ...profile }) => ({
    ...profile,
    whatsapp: null,
    product_count: products?.[0]?.count ?? 0,
  }));
}

export async function getUmkmProfile(id: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_PUBLIC_COLUMNS)
    .eq("id", id)
    .eq("role", "umkm")
    .maybeSingle<Omit<Profile, "whatsapp">>();
  return data ? { ...data, whatsapp: null } : null;
}
