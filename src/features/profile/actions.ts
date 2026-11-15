"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { readImage, uploadImage } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/database";

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, message: "Sesi berakhir, silakan masuk kembali." };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const businessName = String(formData.get("business_name") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").replace(/[\s-]/g, "");
  const description = String(formData.get("description") ?? "").trim();

  if (fullName.length < 3) return { ok: false, message: "Nama minimal 3 karakter." };
  if (profile.role === "umkm" && businessName.length < 2) return { ok: false, message: "Nama usaha wajib diisi." };
  if (whatsapp && !/^(\+62|62|0)8\d{7,12}$/.test(whatsapp)) return { ok: false, message: "Nomor HP tidak valid." };

  // Lokasi diatur terpisah lewat pemilih peta (updateLocation).
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      business_name: profile.role === "umkm" ? businessName : null,
      whatsapp: whatsapp || null,
      description: description || null,
    })
    .eq("id", profile.id);

  if (error) return { ok: false, message: "Gagal menyimpan profil." };

  revalidatePath("/", "layout");
  return { ok: true, message: "Profil berhasil diperbarui." };
}

/** Simpan titik lokasi dari GPS / pin peta beserta nama daerahnya. */
export async function updateLocation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, message: "Sesi berakhir, silakan masuk kembali." };

  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const location = String(formData.get("location") ?? "").trim();

  // Batas kasar wilayah Indonesia agar titik nyasar (mis. 0,0) tertolak
  const insideIndonesia = latitude >= -11.5 && latitude <= 6.5 && longitude >= 94 && longitude <= 141.5;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !insideIndonesia) {
    return { ok: false, message: "Titik lokasi harus berada di wilayah Indonesia." };
  }
  if (location.length < 3) return { ok: false, message: "Nama daerah minimal 3 karakter." };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ latitude, longitude, location }).eq("id", profile.id);
  if (error) return { ok: false, message: "Gagal menyimpan lokasi." };

  revalidatePath("/", "layout");
  return { ok: true, message: "Lokasi tersimpan! Jarak ke mitra kini dihitung dari titik ini." };
}

export async function updateAvatar(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) return;

  const image = readImage(formData, "avatar");
  if (!image || "error" in image) return;

  const supabase = await createClient();
  const url = await uploadImage(supabase, STORAGE_BUCKETS.avatars, profile.id, image);
  await supabase.from("profiles").update({ avatar_url: url }).eq("id", profile.id);
  revalidatePath("/", "layout");
}
