import type { Metadata } from "next";
import { ChatInboxPage } from "@/features/chat/components/ChatPages";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Chat" };

export default async function PetaniChatPage() {
  const profile = await requireRole("petani");
  return <ChatInboxPage profile={profile} />;
}
