import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Mulai (atau lanjutkan) chat UMKM dengan petani pemilik penawaran.
 * Fungsi DB start_conversation aman dipanggil berulang (mengembalikan percakapan yang sama).
 */
export default async function StartChatPage({ params }: PageProps<"/dashboard/umkm/chat/mulai/[offerId]">) {
  await requireRole("umkm");
  const { offerId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(offerId)) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_conversation", { p_offer_id: offerId });
  if (error || !data) notFound();

  redirect(`/dashboard/umkm/chat/${data as string}`);
}
