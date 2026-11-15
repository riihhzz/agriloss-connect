"use server";

import { headers } from "next/headers";
import { getCurrentProfile } from "@/lib/auth";
import { AiUnavailableError, generate, rateLimited, textOf, type FunctionDeclaration, type GeminiContent, type GeminiPart } from "@/lib/ai/gemini";
import { MIN_SHELF_LIFE_DAYS, PRODUCT_CATEGORY_LABEL, RIPENESS_LABEL, STATUS_LABEL } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { displayName, savingsPercent } from "@/lib/utils";
import type { OfferStatus, ProductCategory, Ripeness, UserRole } from "@/types/database";

export type AssistantMessage = { role: "user" | "assistant"; text: string };
export type AssistantLink = { label: string; href: string };
export type AssistantReply = { ok: true; text: string; links: AssistantLink[] } | { ok: false; message: string };

type Viewer = { id: string; role: UserRole; name: string } | null;

const likePattern = (value: string) => `%${value.replace(/[%_\\]/g, (char) => `\\${char}`)}%`;

// ───────────────────────── Alat (function calling) ─────────────────────────

const TOOL_PRODUCTS: FunctionDeclaration = {
  name: "cari_produk",
  description: "Cari produk olahan di katalog UMKM mitra (publik).",
  parameters: {
    type: "OBJECT",
    properties: {
      kata_kunci: { type: "STRING", description: "Kata kunci nama produk, mis. es krim" },
      kategori: { type: "STRING", enum: Object.keys(PRODUCT_CATEGORY_LABEL) },
      buah: { type: "STRING", description: "Buah bahan baku, mis. Mangga" },
      harga_maks: { type: "INTEGER", description: "Harga maksimal dalam rupiah" },
    },
  },
};

const TOOL_STATS: FunctionDeclaration = {
  name: "statistik_platform",
  description: "Jumlah petani, UMKM mitra, dan total Kg food loss yang sudah diselamatkan.",
};

const TOOL_OFFERS: FunctionDeclaration = {
  name: "cari_penawaran",
  description: "Cari penawaran hasil panen dari petani yang masih tersedia (khusus UMKM).",
  parameters: {
    type: "OBJECT",
    properties: {
      buah: { type: "STRING", description: "Jenis buah, mis. Mangga" },
      lokasi: { type: "STRING", description: "Nama daerah, mis. Lembang" },
      harga_maks_per_kg: { type: "INTEGER" },
      jumlah_min_kg: { type: "NUMBER" },
    },
  },
};

const TOOL_MY_STOCK: FunctionDeclaration = {
  name: "stok_saya",
  description: "Daftar stok bahan baku milik UMKM ini beserta sisa Kg dan batas kesegaran (urut paling cepat habis masa segar).",
};

const TOOL_MY_OFFERS: FunctionDeclaration = {
  name: "penawaran_saya",
  description: "Daftar penawaran milik petani ini beserta statusnya.",
};

function toolsFor(viewer: Viewer) {
  const tools = [TOOL_PRODUCTS, TOOL_STATS];
  if (viewer?.role === "umkm") tools.push(TOOL_OFFERS, TOOL_MY_STOCK);
  if (viewer?.role === "petani") tools.push(TOOL_MY_OFFERS);
  return tools;
}

type ToolResult = { data: Record<string, unknown>; links: AssistantLink[] };

async function runTool(name: string, args: Record<string, unknown>, viewer: Viewer): Promise<ToolResult> {
  const supabase = await createClient();

  if (name === "cari_produk") {
    let request = supabase
      .from("products")
      .select("id, name, price, category, fruit, umkm:profiles!products_umkm_id_fkey(id, full_name, business_name, location)")
      .eq("is_available", true)
      .order("price", { ascending: true })
      .limit(5);
    if (typeof args.kata_kunci === "string" && args.kata_kunci) request = request.ilike("name", likePattern(args.kata_kunci));
    if (typeof args.kategori === "string" && args.kategori in PRODUCT_CATEGORY_LABEL) request = request.eq("category", args.kategori);
    if (typeof args.buah === "string" && args.buah) request = request.ilike("fruit", args.buah);
    if (typeof args.harga_maks === "number") request = request.lte("price", args.harga_maks);
    const { data } = await request;
    type Row = { id: string; name: string; price: number; category: ProductCategory; fruit: string | null; umkm: { id: string; full_name: string; business_name: string | null; location: string | null } | null };
    const rows = (data as unknown as Row[]) ?? [];
    return {
      data: {
        produk: rows.map((row) => ({
          nama: row.name,
          harga: row.price,
          kategori: PRODUCT_CATEGORY_LABEL[row.category],
          buah: row.fruit,
          umkm: displayName(row.umkm),
          lokasi: row.umkm?.location,
        })),
      },
      links: rows.filter((row) => row.umkm).map((row) => ({ label: `${row.name} — ${displayName(row.umkm)}`, href: `/mitra/${row.umkm!.id}` })),
    };
  }

  if (name === "statistik_platform") {
    const { data } = await supabase.rpc("get_public_stats").single<{ petani_count: number; umkm_count: number; saved_kg: number }>();
    return { data: { petani: data?.petani_count ?? 0, umkm: data?.umkm_count ?? 0, food_loss_kg: Number(data?.saved_kg ?? 0) }, links: [] };
  }

  if (name === "cari_penawaran" && viewer?.role === "umkm") {
    let request = supabase
      .from("offers")
      .select("id, fruit_type, ripeness, quantity_kg, price_per_kg, market_price_per_kg, shelf_life_days, location, petani:profiles!offers_petani_id_fkey(full_name)")
      .eq("status", "menawarkan")
      .order("created_at", { ascending: false })
      .limit(5);
    if (typeof args.buah === "string" && args.buah) request = request.ilike("fruit_type", likePattern(args.buah));
    if (typeof args.lokasi === "string" && args.lokasi) request = request.ilike("location", likePattern(args.lokasi));
    if (typeof args.harga_maks_per_kg === "number") request = request.lte("price_per_kg", args.harga_maks_per_kg);
    if (typeof args.jumlah_min_kg === "number") request = request.gte("quantity_kg", args.jumlah_min_kg);
    const { data } = await request;
    type Row = { id: string; fruit_type: string; ripeness: Ripeness; quantity_kg: number; price_per_kg: number; market_price_per_kg: number | null; shelf_life_days: number | null; location: string; petani: { full_name: string } | null };
    const rows = (data as unknown as Row[]) ?? [];
    return {
      data: {
        penawaran: rows.map((row) => ({
          buah: row.fruit_type,
          kematangan: RIPENESS_LABEL[row.ripeness],
          jumlah_kg: Number(row.quantity_kg),
          harga_per_kg: row.price_per_kg,
          hemat_persen: savingsPercent(row.price_per_kg, row.market_price_per_kg),
          layak_hari: row.shelf_life_days,
          lokasi: row.location,
          petani: row.petani?.full_name,
        })),
      },
      links: rows.map((row) => ({ label: `${row.fruit_type} ${Number(row.quantity_kg)} Kg · ${row.location}`, href: `/dashboard/umkm/penawaran/${row.id}` })),
    };
  }

  if (name === "stok_saya" && viewer?.role === "umkm") {
    const { data } = await supabase
      .from("stocks")
      .select("fruit_type, quantity_kg, used_kg, fresh_until, petani_name")
      .eq("umkm_id", viewer.id)
      .order("fresh_until", { ascending: true })
      .limit(10);
    const rows = (data ?? []).map((row) => ({
      buah: row.fruit_type,
      sisa_kg: Number(row.quantity_kg) - Number(row.used_kg),
      segar_sampai: row.fresh_until,
      dari_petani: row.petani_name,
    }));
    return { data: { stok: rows.filter((row) => row.sisa_kg > 0), hari_ini: new Date().toISOString().slice(0, 10) }, links: [{ label: "Buka halaman Stok", href: "/dashboard/umkm/stok" }] };
  }

  if (name === "penawaran_saya" && viewer?.role === "petani") {
    const { data } = await supabase
      .from("offers")
      .select("fruit_type, quantity_kg, price_per_kg, status, shelf_life_days, created_at")
      .eq("petani_id", viewer.id)
      .order("created_at", { ascending: false })
      .limit(8);
    return {
      data: {
        penawaran: (data ?? []).map((row) => ({
          buah: row.fruit_type,
          jumlah_kg: Number(row.quantity_kg),
          harga_per_kg: row.price_per_kg,
          status: STATUS_LABEL[row.status as OfferStatus],
          layak_hari: row.shelf_life_days,
        })),
      },
      links: [{ label: "Buka Riwayat Penawaran", href: "/dashboard/petani/riwayat" }],
    };
  }

  return { data: { error: "Alat tidak tersedia untuk pengguna ini." }, links: [] };
}

// ───────────────────────── Prompt sistem ─────────────────────────

function systemPrompt(viewer: Viewer) {
  const who = viewer
    ? `Pengguna saat ini: ${viewer.name} (peran: ${viewer.role === "umkm" ? "UMKM pengolah" : "petani"}).`
    : "Pengguna saat ini: pengunjung yang belum masuk.";
  return `Kamu adalah "Si Jeruk", asisten ramah berbentuk maskot jeruk di website Agriloss.Connect.
${who}

Tentang Agriloss.Connect:
- Pasar khusus hasil panen sisa musim / tidak lolos sortir (kecil, tergores, terlalu matang) agar tidak terbuang.
- Harga harus jauh di bawah harga pasar; buah masih layak diolah minimal ${MIN_SHELF_LIFE_DAYS} hari. Bukan untuk buah premium harga normal, bukan buah busuk.
- Alur: petani mengirim penawaran (foto, harga, perkiraan masa layak; bisa "Cek Kondisi Buah dengan AI") → UMKM chat & menerima →
  UMKM membayar lewat QRIS, Virtual Account (BCA/BNI/BRI/Mandiri), atau Saldo Agriloss → setelah lunas transaksi selesai,
  stok UMKM bertambah otomatis dan uang masuk ke Saldo Agriloss petani. Pembayaran di versi ini adalah simulasi (tanpa uang sungguhan).
- Saldo Agriloss (menu Saldo): petani menerima hasil penjualan dan bisa menarik ke rekening bank/e-wallet (minimal Rp10.000);
  UMKM bisa isi saldo lalu membayar transaksi dengan saldo.
- Biaya layanan platform 2% dari nilai belanja, maksimal Rp5.000, dibayar UMKM. Petani menerima harga penuh.
- Fitur: chat in-app petani–UMKM, laporan keuangan, stok + input pemakaian, katalog produk olahan + QR katalog, peta lokasi.
- Pengunjung umum bisa melihat katalog produk olahan & profil UMKM, lalu membeli langsung di outlet UMKM.

Aturan menjawab:
- Bahasa Indonesia santai-sopan, singkat (maks ±100 kata), boleh pakai poin "-". Jangan memakai emoji.
- Untuk data (produk, penawaran, stok, statistik) WAJIB pakai alat yang tersedia; jangan mengarang data.
  Jika alat tidak mengembalikan hasil, katakan belum ada dan sarankan langkah lain.
- Tautan ke hasil sudah otomatis ditampilkan sebagai tombol di bawah jawabanmu; cukup sebutkan ringkasannya.
- Jika ditanya hal di luar Agriloss (politik, tugas sekolah, dll.), tolak dengan sopan dan arahkan kembali ke topik pangan/Agriloss.
- Jangan pernah meminta kata sandi atau data pribadi.`;
}

// ───────────────────────── Aksi utama ─────────────────────────

export async function askAssistant(history: AssistantMessage[]): Promise<AssistantReply> {
  const profile = await getCurrentProfile();
  const viewer: Viewer = profile ? { id: profile.id, role: profile.role, name: displayName(profile) } : null;

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(`assistant:${viewer?.id ?? ip}`, 15)) {
    return { ok: false, message: "Si Jeruk sedang kewalahan. Tunggu sebentar lalu coba lagi." };
  }

  const cleaned = history
    .filter((message) => message.text.trim())
    .slice(-10)
    .map<GeminiContent>((message) => ({
      role: message.role === "user" ? "user" : "model",
      parts: [{ text: message.text.slice(0, 1000) }],
    }));
  if (!cleaned.length || cleaned.at(-1)?.role !== "user") return { ok: false, message: "Tulis pertanyaanmu dulu, ya." };

  const tools = toolsFor(viewer);
  const contents = [...cleaned];
  const links: AssistantLink[] = [];

  try {
    for (let round = 0; round < 3; round++) {
      const reply = await generate({ system: systemPrompt(viewer), contents, tools, temperature: 0.5 });
      const calls = reply.parts.filter((part): part is Extract<GeminiPart, { functionCall: unknown }> => "functionCall" in part);

      if (!calls.length) {
        const text = textOf(reply) || "Maaf, Si Jeruk belum menemukan jawabannya. Coba tanya dengan kalimat lain, ya.";
        const unique = links.filter((link, index) => links.findIndex((other) => other.label === link.label) === index).slice(0, 5);
        return { ok: true, text, links: unique };
      }

      contents.push(reply); // kembalikan apa adanya (termasuk thoughtSignature)
      const responses: GeminiPart[] = [];
      for (const call of calls) {
        const result = await runTool(call.functionCall.name, call.functionCall.args ?? {}, viewer);
        links.push(...result.links);
        responses.push({ functionResponse: { id: call.functionCall.id, name: call.functionCall.name, response: result.data } });
      }
      contents.push({ role: "user", parts: responses });
    }
    return { ok: true, text: "Maaf, pertanyaannya terlalu rumit untuk Si Jeruk. Coba dipecah jadi lebih sederhana, ya.", links };
  } catch (error) {
    if (error instanceof AiUnavailableError) return { ok: false, message: error.message };
    console.error("[askAssistant]", error);
    return { ok: false, message: "Si Jeruk sedang mengalami gangguan. Coba lagi sebentar lagi." };
  }
}
