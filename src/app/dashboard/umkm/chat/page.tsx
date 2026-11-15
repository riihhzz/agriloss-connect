import type { Metadata } from "next";
import { ChatInboxPage } from "@/features/chat/components/ChatPages";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Chat" };

export default async function UmkmChatPage() {
  const profile = await requireRole("umkm");
  return <ChatInboxPage profile={profile} />;
}
