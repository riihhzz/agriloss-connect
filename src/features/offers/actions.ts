"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { readImage, uploadImage } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { payOffer } from "@/features/payments/actions";
import type { ActionState, Ripeness } from "@/types/database";

const RIPENESS: Ripeness[] = ["mentah", "setengah_matang", "matang", "sangat_matang"];

function revalidateOffers() {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/");
}

/** Petani menambah penawaran hasil panen. */
export async function createOffer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const profile = await requireRole("petani");

  const fruitType = String(formData.get("fruit_type") ?? "").trim();
  const ripeness = String(formData.get("ripeness") ?? "matang") as Ripeness;
  const quantity = Number(formData.get("quantity_kg"));
  const price = Number(formData.get("price_per_kg"));
  const location = String(formData.get("location") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const marketRaw = String(formData.get("market_price_per_kg") ?? "").trim();
  const marketPrice = marketRaw ? Number(marketRaw) : null;
  const shelfLife = Number(formData.get("shelf_life_days"));

  if (fruitType.length < 2) return { ok: false, message: "Jenis buah wajib diisi." };
  if (!RIPENESS.includes(ripeness)) return { ok: false, message: "Tingkat kematangan tidak valid." };
  if (!Number.isFinite(quantity) || quantity <= 0) return { ok: false, message: "Jumlah (Kg) harus lebih dari 0." };
  if (!Number.isFinite(price) || price < 0) return { ok: false, message: "Harga per Kg tidak valid." };
  if (marketPrice !== null && (!Number.isFinite(marketPrice) || marketPrice < 0)) {
    return { ok: false, message: "Harga pasar tidak valid." };
  }
  if (!Number.isInteger(shelfLife) || shelfLife < 0 || shelfLife > 60) {
    return { ok: false, message: "Perkiraan masa layak harus 0–60 hari." };
  }
  if (location.length < 3) return { ok: false, message: "Lokasi wajib diisi." };
  if (formData.get("agree") !== "on") return { ok: false, message: "Centang pernyataan ketentuan terlebih dahulu." };

  const photo = readImage(formData, "photo");
  if (photo && "error" in photo) return { ok: false, message: photo.error };

  const supabase = await createClient();
  let photoUrl: string | null = null;
  try {
    if (photo) photoUrl = await uploadImage(supabase, STORAGE_BUCKETS.offers, profile.id, photo);
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }

  const { error } = await supabase.from("offers").insert({
    petani_id: profile.id,
    fruit_type: fruitType,
    ripeness,
    quantity_kg: quantity,
    price_per_kg: Math.round(price),
    market_price_per_kg: marketPrice === null ? null : Math.round(marketPrice),
    shelf_life_days: shelfLife,
    location,
    // Kolom lama (wajib di DB). Komunikasi kini lewat chat in-app.
    whatsapp: "-", // kolom lama; kontak kini lewat chat di dalam aplikasi
    notes: notes || null,
    photo_url: photoUrl,
  });

  if (error) return { ok: false, message: "Gagal mengirim penawaran. Coba lagi." };

  revalidateOffers();
  return { ok: true, message: "Penawaran terkirim! UMKM mitra sekarang dapat melihat hasil panenmu." };
}

/** Jalankan RPC alur penawaran dan kembalikan pesan error yang ramah. */
async function runOfferRpc(fn: string, args: Record<string, unknown>) {
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, args);
  return error ? error.message : null;
}

export async function withdrawOffer(formData: FormData) {
  await requireRole("petani");
  await runOfferRpc("withdraw_offer", { p_offer_id: String(formData.get("id")) });
  revalidateOffers();
}

/** UMKM menerima penawaran -> status "diterima", lalu diarahkan ke halaman konfirmasi. */
export async function acceptOffer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("umkm");
  const id = String(formData.get("id"));
  const error = await runOfferRpc("accept_offer", { p_offer_id: id });
  if (error) return { ok: false, message: error };
  revalidateOffers();
  redirect(`/dashboard/umkm/penawaran/${id}`);
}

/** Keputusan akhir UMKM: bayar (lewat simulasi pembayaran) atau batal (kembali ditawarkan). */
export async function decideOffer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("umkm");
  const id = String(formData.get("id"));
  const decision = String(formData.get("decision"));

  if (decision === "lanjutkan") return payOffer(formData);

  if (decision === "batal") {
    const error = await runOfferRpc("cancel_acceptance", { p_offer_id: id });
    if (error) return { ok: false, message: error };
    revalidateOffers();
    redirect("/dashboard/umkm/penawaran");
  }

  return { ok: false, message: "Keputusan tidak dikenali." };
}
