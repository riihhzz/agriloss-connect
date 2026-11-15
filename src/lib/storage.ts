import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_IMAGE_BYTES } from "@/lib/constants";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Validasi file gambar dari FormData. Mengembalikan null jika tidak ada file. */
export function readImage(formData: FormData, field: string): File | null | { error: string } {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) return null;
  if (!ALLOWED_TYPES.includes(file.type)) return { error: "Format gambar harus JPG, PNG, atau WEBP." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "Ukuran gambar maksimal 5 MB." };
  return file;
}

/** Upload gambar ke folder milik user (`<uid>/...`) dan kembalikan URL publiknya. */
export async function uploadImage(supabase: SupabaseClient, bucket: string, userId: string, file: File) {
  const ext = file.type.split("/")[1] ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(`Gagal mengunggah gambar: ${error.message}`);

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
