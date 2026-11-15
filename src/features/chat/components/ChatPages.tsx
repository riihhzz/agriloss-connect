import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Container, PageTitle } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChatRoom } from "@/features/chat/components/ChatRoom";
import { ConversationList } from "@/features/chat/components/ConversationList";
import { getConversation, getMyConversations } from "@/features/chat/queries";
import { StatusBadge } from "@/features/offers/components/StatusBadge";
import { displayName, formatKg } from "@/lib/utils";
import type { Profile } from "@/types/database";

const UUID_RE = /^[0-9a-f-]{36}$/i;

/** Halaman kotak masuk chat (dipakai petani & UMKM). */
export async function ChatInboxPage({ profile }: { profile: Profile }) {
  const basePath = `/dashboard/${profile.role}/chat`;
  const conversations = await getMyConversations(profile.id, profile.role);

  return (
    <Container className="pt-6 sm:pt-10">
      <PageTitle
        title="Chat"
        description={
          profile.role === "umkm"
            ? "Diskusikan jumlah, harga, dan penjemputan langsung dengan petani."
            : "Balas pertanyaan UMKM tentang hasil panenmu."
        }
      />
      {conversations.length > 0 ? (
        <ConversationList conversations={conversations} basePath={basePath} currentUserId={profile.id} />
      ) : (
        <EmptyState
          title="Belum ada percakapan"
          description={
            profile.role === "umkm"
              ? "Buka detail penawaran petani lalu klik “Tanya Petani Dulu” untuk memulai chat."
              : "Percakapan muncul ketika UMKM bertanya atau menerima penawaranmu."
          }
        />
      )}
    </Container>
  );
}

/** Halaman satu percakapan. */
export async function ChatRoomPage({ profile, conversationId }: { profile: Profile; conversationId: string }) {
  if (!UUID_RE.test(conversationId)) notFound();
  const conversation = await getConversation(conversationId);
  if (!conversation) notFound();

  const basePath = `/dashboard/${profile.role}/chat`;
  const partner = profile.role === "umkm" ? conversation.petani : conversation.umkm;
  const partnerName = displayName(partner);
  const offerHref =
    profile.role === "umkm" ? `/dashboard/umkm/penawaran/${conversation.offer_id}` : "/dashboard/petani/riwayat";

  return (
    <Container className="pt-6 sm:pt-10">
      <Link href={basePath} className="mb-4 inline-block text-sm font-semibold text-leaf-800 hover:underline">
        ← Semua chat
      </Link>

      <header className="mb-4 flex flex-wrap items-center gap-4 rounded-3xl bg-leaf-700 p-4 text-white sm:p-5">
        <Avatar name={partnerName} url={partner?.avatar_url ?? null} size={56} />
        <div className="min-w-40 flex-1">
          <h1 className="truncate text-xl font-bold sm:text-2xl">{partnerName}</h1>
          <p className="text-sm text-leaf-100">
            {profile.role === "umkm" ? "Petani" : "UMKM"} · {partner?.location ?? "Lokasi belum diisi"}
          </p>
        </div>
        {conversation.offer && (
          <Link href={offerHref} className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white/10 px-4 py-2 text-sm hover:bg-white/20 sm:w-auto sm:justify-start">
            <span>
              <b>{conversation.offer.fruit_type}</b> · {formatKg(conversation.offer.quantity_kg)}
            </span>
            <StatusBadge status={conversation.offer.status} />
          </Link>
        )}
      </header>

      <ChatRoom
        conversationId={conversation.id}
        currentUserId={profile.id}
        initialMessages={conversation.messages}
        partnerName={partnerName}
      />
      <p className="mt-3 text-center text-xs text-neutral-600">
        Semua percakapan tersimpan di Agriloss.Connect. Jangan pernah membagikan kata sandi atau kode OTP kepada siapa pun.
      </p>
    </Container>
  );
}
