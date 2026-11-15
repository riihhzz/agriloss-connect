import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Message, OfferStatus, Profile, UserRole } from "@/types/database";

type Party = Pick<Profile, "id" | "full_name" | "business_name" | "avatar_url" | "location">;

export type ConversationSummary = {
  id: string;
  offer_id: string;
  last_message_at: string;
  offer: { fruit_type: string; quantity_kg: number; status: OfferStatus } | null;
  /** lawan bicara (petani bagi UMKM, UMKM bagi petani) */
  partner: Party | null;
  lastMessage: Pick<Message, "body" | "sender_id" | "created_at"> | null;
  unread: number;
};

const PARTY = "id, full_name, business_name, avatar_url, location";
const SELECT = `id, offer_id, petani_id, umkm_id, last_message_at,
  offer:offers(fruit_type, quantity_kg, status),
  petani:profiles!conversations_petani_id_fkey(${PARTY}),
  umkm:profiles!conversations_umkm_id_fkey(${PARTY})`;

type Row = {
  id: string;
  offer_id: string;
  petani_id: string;
  umkm_id: string;
  last_message_at: string;
  offer: ConversationSummary["offer"];
  petani: Party | null;
  umkm: Party | null;
};

/** Semua percakapan milik user (RLS: hanya yang ia ikuti), terbaru di atas. */
export async function getMyConversations(userId: string, role: UserRole): Promise<ConversationSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("conversations").select(SELECT).order("last_message_at", { ascending: false });
  const rows = (data as unknown as Row[]) ?? [];
  if (rows.length === 0) return [];

  const { data: messages } = await supabase
    .from("messages")
    .select("conversation_id, body, sender_id, created_at, read_at")
    .in("conversation_id", rows.map((row) => row.id))
    .order("created_at", { ascending: false })
    .limit(500);

  return rows
    .map((row) => {
      const own = (messages ?? []).filter((message) => message.conversation_id === row.id);
      return {
        id: row.id,
        offer_id: row.offer_id,
        last_message_at: row.last_message_at,
        offer: row.offer,
        partner: role === "umkm" ? row.petani : row.umkm,
        lastMessage: own[0] ?? null,
        unread: own.filter((message) => message.sender_id !== userId && !message.read_at).length,
      };
    })
    // Percakapan kosong dari penawaran yang sudah ditarik / tidak lagi tersedia tidak perlu ditampilkan
    .filter((item) => item.lastMessage || (item.offer && item.offer.status !== "dibatalkan"));
}

export type ConversationDetail = Row & { messages: Message[] };

export async function getConversation(id: string): Promise<ConversationDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("conversations").select(SELECT).eq("id", id).maybeSingle();
  if (!data) return null;

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: false })
    .limit(300);

  // Ambil 300 pesan TERBARU, lalu balik urutannya agar tampil dari lama ke baru
  return { ...(data as unknown as Row), messages: ((messages as Message[]) ?? []).reverse() };
}

/** Jumlah pesan belum dibaca dari lawan bicara (untuk ikon chat di navbar). */
export async function getUnreadChatCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .is("read_at", null)
    .neq("sender_id", userId);
  return count ?? 0;
}

/** Percakapan untuk satu penawaran (dipakai petani dari halaman riwayat). */
export async function findConversationForOffer(offerId: string, umkmId?: string | null) {
  const supabase = await createClient();
  let request = supabase.from("conversations").select("id").eq("offer_id", offerId).order("last_message_at", { ascending: false });
  if (umkmId) request = request.eq("umkm_id", umkmId);
  const { data } = await request.limit(1).maybeSingle();
  return (data?.id as string | undefined) ?? null;
}
