import type { Metadata } from "next";
import { ChatRoomPage } from "@/features/chat/components/ChatPages";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Chat" };

export default async function PetaniChatRoomPage({ params }: PageProps<"/dashboard/petani/chat/[id]">) {
  const profile = await requireRole("petani");
  const { id } = await params;
  return <ChatRoomPage profile={profile} conversationId={id} />;
}
