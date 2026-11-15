"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/database";

const timeFormat = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
const dayFormat = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Jakarta" });

/**
 * Ruang chat real-time. Pesan dikirim langsung ke tabel `messages`
 * (RLS memastikan hanya anggota percakapan yang bisa mengirim/membaca),
 * dan pesan baru diterima lewat Supabase Realtime.
 */
export function ChatRoom({
  conversationId,
  currentUserId,
  initialMessages,
  partnerName,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
  partnerName: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Tandai pesan dari lawan bicara sebagai sudah dibaca
  useEffect(() => {
    const hasUnread = messages.some((message) => message.sender_id !== currentUserId && !message.read_at);
    if (!hasUnread) return;
    const readAt = new Date().toISOString();
    // Query builder Supabase baru dijalankan saat di-await/then — jangan cukup `void`
    supabase
      .from("messages")
      .update({ read_at: readAt })
      .eq("conversation_id", conversationId)
      .neq("sender_id", currentUserId)
      .is("read_at", null)
      .then(({ error: updateError }) => {
        if (updateError) return;
        setMessages((current) =>
          current.map((message) => (message.sender_id !== currentUserId && !message.read_at ? { ...message, read_at: readAt } : message)),
        );
      });
  }, [messages, conversationId, currentUserId, supabase]);

  // Langganan pesan baru secara real-time
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((current) => (current.some((message) => message.id === incoming.id) ? current : [...current, incoming]));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((current) => current.map((message) => (message.id === updated.id ? { ...message, read_at: updated.read_at } : message)));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  // Gulir ke pesan terbaru
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    const { data, error: insertError } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: currentUserId, body })
      .select()
      .single<Message>();
    setSending(false);
    if (insertError || !data) {
      setError("Pesan gagal terkirim. Periksa koneksi lalu coba lagi.");
      return;
    }
    setDraft("");
    setMessages((current) => (current.some((message) => message.id === data.id) ? current : [...current, data]));
  };

  return (
    <div className="flex h-[min(70vh,640px)] flex-col overflow-hidden rounded-3xl bg-white/80 shadow-card">
      <div className="flex-1 space-y-2 overflow-y-auto bg-[radial-gradient(circle_at_top,#f4f9ee,transparent_70%)] p-4 sm:p-6" aria-live="polite">
        {messages.length === 0 && (
          <p className="mt-10 text-center text-sm text-neutral-600">
            Belum ada pesan. Sapa {partnerName} untuk membahas jumlah, harga, dan waktu penjemputan.
          </p>
        )}
        {messages.map((message, index) => {
          const mine = message.sender_id === currentUserId;
          const day = dayFormat.format(new Date(message.created_at));
          const showDay = index === 0 || dayFormat.format(new Date(messages[index - 1].created_at)) !== day;
          return (
            <div key={message.id}>
              {showDay && (
                <p className="my-3 text-center text-xs font-semibold text-neutral-500">
                  <span className="rounded-full bg-leaf-100 px-3 py-1">{day}</span>
                </p>
              )}
              <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                    mine ? "rounded-br-sm bg-leaf-700 text-white" : "rounded-bl-sm bg-white text-ink",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                  <p className={cn("mt-1 text-right text-[10px]", mine ? "text-leaf-100" : "text-neutral-500")}>
                    {timeFormat.format(new Date(message.created_at))}
                    {mine && (message.read_at ? " · Dibaca" : " · Terkirim")}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex items-end gap-2 border-t border-leaf-200 bg-white p-3">
        <label htmlFor="chat-input" className="sr-only">
          Tulis pesan untuk {partnerName}
        </label>
        <textarea
          id="chat-input"
          rows={1}
          value={draft}
          maxLength={2000}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder={`Tulis pesan untuk ${partnerName}…`}
          className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl bg-field px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-leaf-700"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-leaf-700 text-white transition hover:bg-leaf-800 disabled:opacity-50"
          aria-label="Kirim pesan"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" />
          </svg>
        </button>
      </form>
      {error && (
        <p role="alert" className="bg-red-50 px-4 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
