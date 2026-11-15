import { redirect } from "next/navigation";
import { findConversationForOffer } from "@/features/chat/queries";
import { requireRole } from "@/lib/auth";

/** Dari riwayat petani: buka chat dengan UMKM untuk penawaran tertentu. */
export default async function PetaniOfferChatRedirect({ params, searchParams }: PageProps<"/dashboard/petani/chat/penawaran/[offerId]">) {
  await requireRole("petani");
  const { offerId } = await params;
  const { umkm } = await searchParams;
  const conversationId = /^[0-9a-f-]{36}$/i.test(offerId)
    ? await findConversationForOffer(offerId, typeof umkm === "string" ? umkm : null)
    : null;
  redirect(conversationId ? `/dashboard/petani/chat/${conversationId}` : "/dashboard/petani/chat");
}
