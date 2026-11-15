import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/features/offers/components/StatusBadge";
import type { ConversationSummary } from "@/features/chat/queries";
import { cn, displayName, formatKg } from "@/lib/utils";

const relative = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });

/** Daftar percakapan (kotak masuk chat). */
export function ConversationList({
  conversations,
  basePath,
  activeId,
  currentUserId,
}: {
  conversations: ConversationSummary[];
  basePath: string;
  activeId?: string;
  currentUserId: string;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {conversations.map((conversation) => {
        const name = displayName(conversation.partner);
        const last = conversation.lastMessage;
        return (
          <li key={conversation.id}>
            <Link
              href={`${basePath}/${conversation.id}`}
              aria-current={activeId === conversation.id ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-2xl p-3 transition",
                activeId === conversation.id ? "bg-leaf-700 text-white" : "bg-white/70 hover:bg-white",
              )}
            >
              <Avatar name={name} url={conversation.partner?.avatar_url ?? null} size={48} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-bold">{name}</p>
                  {last && <span className="shrink-0 text-[11px] opacity-70">{relative.format(new Date(last.created_at))}</span>}
                </div>
                {conversation.offer && (
                  <p className="truncate text-xs opacity-80">
                    {conversation.offer.fruit_type} · {formatKg(conversation.offer.quantity_kg)}
                  </p>
                )}
                <p className="truncate text-sm opacity-90">
                  {last ? `${last.sender_id === currentUserId ? "Kamu: " : ""}${last.body}` : "Belum ada pesan"}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {conversation.offer && <StatusBadge status={conversation.offer.status} className="hidden sm:inline-flex" />}
                {conversation.unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sun px-1.5 text-[11px] font-bold text-white">
                    {conversation.unread}
                  </span>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
