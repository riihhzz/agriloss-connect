"use server";

import { getCurrentProfile } from "@/lib/auth";
import { AiUnavailableError, generate, rateLimited, textOf } from "@/lib/ai/gemini";
import { MIN_SHELF_LIFE_DAYS } from "@/lib/constants";
import type { Ripeness } from "@/types/database";

export type FruitCheckResult = {
  ok: true;
  buah: string;
  kematangan: Ripeness;
  perkiraan_layak_hari: number;
  layak_dijual: boolean;
  kondisi: string;
  alasan: string;
  saran_olahan: string[];
};

export type FruitCheckResponse = FruitCheckResult | { ok: false; message: string };

const SCHEMA = {
  type: "OBJECT",
  properties: {
    adalah_buah: { type: "BOOLEAN", description: "true jika foto berisi buah/sayur hasil panen" },
    buah: { type: "STRING", description: "Nama buah dalam Bahasa Indonesia, mis. Mangga" },
    kematangan: { type: "STRING", enum: ["mentah", "setengah_matang", "matang", "sangat_matang"] },
    perkiraan_layak_hari: { type: "INTEGER", description: "Perkiraan berapa hari lagi masih layak diolah (0-14)" },
    layak_dijual: { type: "BOOLEAN", description: "false jika tampak busuk/berjamur/rusak parah" },
    kondisi: { type: "STRING", description: "Ringkasan kondisi visual dalam 1 kalimat" },
    alasan: { type: "STRING", description: "Alasan singkat penilaian (maks 2 kalimat)" },
    saran_olahan: { type: "ARRAY", items: { type: "STRING" }, description: "2-4 ide produk olahan yang cocok" },
  },
  required: ["adalah_buah", "buah", "kematangan", "perkiraan_layak_hari", "layak_dijual", "kondisi", "alasan", "saran_olahan"],
};

const SYSTEM = `Kamu adalah penilai mutu hasil panen untuk Agriloss.Connect, platform jual-beli buah sisa musim
dan tidak lolos sortir dari petani ke UMKM pengolah. Nilai foto secara jujur dan konservatif.
Buah tergores, kecil, atau terlalu matang tetap LAYAK dijual bila belum busuk. Tandai tidak layak hanya
jika terlihat busuk, berjamur, berair/berlendir, atau rusak parah. Perkiraan masa layak dalam hari,
dengan asumsi disimpan di suhu ruang. Jawab dalam Bahasa Indonesia yang sederhana.`;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Analisis foto kondisi buah dengan Gemini (khusus petani yang login). */
export async function checkFruitPhoto(formData: FormData): Promise<FruitCheckResponse> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "petani") return { ok: false, message: "Fitur ini khusus untuk petani yang sudah masuk." };
  if (rateLimited(`fruit:${profile.id}`, 8)) return { ok: false, message: "Terlalu sering. Tunggu sebentar lalu coba lagi." };

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Pilih foto buah terlebih dahulu." };
  if (!ALLOWED_TYPES.includes(file.type)) return { ok: false, message: "Format foto harus JPG, PNG, atau WEBP." };
  if (file.size > 4 * 1024 * 1024) return { ok: false, message: "Foto terlalu besar untuk dianalisis (maks 4 MB)." };

  const data = Buffer.from(await file.arrayBuffer()).toString("base64");

  try {
    const content = await generate({
      system: SYSTEM,
      temperature: 0.2,
      responseSchema: SCHEMA,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: file.type, data } },
            { text: `Nilai kondisi buah pada foto ini. Batas minimal masa layak di platform: ${MIN_SHELF_LIFE_DAYS} hari.` },
          ],
        },
      ],
    });

    const parsed = JSON.parse(textOf(content)) as Omit<FruitCheckResult, "ok"> & { adalah_buah: boolean };
    if (!parsed.adalah_buah) return { ok: false, message: "Foto tidak terlihat seperti buah hasil panen. Coba foto lebih dekat." };

    return {
      ok: true,
      buah: parsed.buah,
      kematangan: parsed.kematangan,
      perkiraan_layak_hari: Math.max(0, Math.min(14, Math.round(parsed.perkiraan_layak_hari))),
      layak_dijual: parsed.layak_dijual,
      kondisi: parsed.kondisi,
      alasan: parsed.alasan,
      saran_olahan: (parsed.saran_olahan ?? []).slice(0, 4),
    };
  } catch (error) {
    if (error instanceof AiUnavailableError) return { ok: false, message: error.message };
    console.error("[checkFruitPhoto]", error);
    return { ok: false, message: "AI gagal membaca foto. Coba foto lain atau isi manual." };
  }
}
