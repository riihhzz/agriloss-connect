"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { PRODUCT_CATEGORY_LABEL, STORAGE_BUCKETS } from "@/lib/constants";
import { readImage, uploadImage } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import type { ActionState, ProductCategory } from "@/types/database";

function revalidateCatalog(umkmId: string) {
  revalidatePath("/dashboard/umkm", "layout");
  revalidatePath("/katalog");
  revalidatePath(`/mitra/${umkmId}`);
  revalidatePath("/");
}

function parseProduct(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(String(formData.get("price") ?? "").replace(/\D/g, ""));
  const isAvailable = formData.get("is_available") === "on";
  const category = String(formData.get("category") ?? "lainnya");
  const fruitRaw = String(formData.get("fruit") ?? "").trim();
  // Rapikan kapitalisasi: "mangga" → "Mangga"
  const fruit = fruitRaw ? fruitRaw.charAt(0).toUpperCase() + fruitRaw.slice(1).toLowerCase() : null;

  if (name.length < 2) return { error: "Nama produk minimal 2 karakter." } as const;
  if (!Number.isFinite(price) || price <= 0) return { error: "Harga harus lebih dari 0." } as const;
  if (!(category in PRODUCT_CATEGORY_LABEL)) return { error: "Kategori tidak valid." } as const;

  return {
    name,
    description: description || null,
    price,
    is_available: isAvailable,
    category: category as ProductCategory,
    fruit,
  } as const;
}

/** Tambah atau ubah produk (jika ada field `id`). */
export async function saveProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const profile = await requireRole("umkm");
  const parsed = parseProduct(formData);
  if ("error" in parsed) return { ok: false, message: parsed.error! };

  const image = readImage(formData, "image");
  if (image && "error" in image) return { ok: false, message: image.error };

  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");

  let imageUrl: string | undefined;
  try {
    if (image) imageUrl = await uploadImage(supabase, STORAGE_BUCKETS.products, profile.id, image);
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }

  const payload = { ...parsed, ...(imageUrl ? { image_url: imageUrl } : {}) };
  const { error } = id
    ? await supabase.from("products").update(payload).eq("id", id).eq("umkm_id", profile.id)
    : await supabase.from("products").insert({ ...payload, umkm_id: profile.id });

  if (error) return { ok: false, message: "Gagal menyimpan produk. Coba lagi." };

  revalidateCatalog(profile.id);
  return { ok: true, message: id ? "Produk berhasil diperbarui." : "Produk berhasil ditambahkan ke katalog." };
}

export async function toggleProductAvailability(formData: FormData) {
  const profile = await requireRole("umkm");
  const id = String(formData.get("id") ?? "");
  const next = formData.get("next") === "true";

  const supabase = await createClient();
  await supabase.from("products").update({ is_available: next }).eq("id", id).eq("umkm_id", profile.id);
  revalidateCatalog(profile.id);
}

export async function deleteProduct(formData: FormData) {
  const profile = await requireRole("umkm");
  const id = String(formData.get("id") ?? "");

  const supabase = await createClient();
  await supabase.from("products").delete().eq("id", id).eq("umkm_id", profile.id);
  revalidateCatalog(profile.id);
}
