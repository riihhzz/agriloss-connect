"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { askAssistant, type AssistantLink, type AssistantMessage } from "@/features/ai/assistant";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database";

type ChatItem = AssistantMessage & { links?: AssistantLink[]; error?: boolean };

const SUGGESTIONS: Record<UserRole | "guest", string[]> = {
  guest: ["Buah seperti apa yang dijual di sini?", "Cari es krim di bawah Rp20.000", "Berapa food loss yang sudah diselamatkan?"],
  petani: ["Bagaimana cara menawarkan hasil panen?", "Bagaimana status penawaran saya?", "Berapa biaya layanannya?"],
  umkm: ["Ada penawaran mangga di bawah Rp10.000/kg?", "Stok saya yang hampir lewat masa segar?", "Ide olahan untuk stok melon"],
};

/** Ubah teks sederhana bergaya markdown (**tebal**, daftar "- ") menjadi elemen React tanpa HTML mentah. */
function renderText(text: string): ReactNode {
  return text.trim().replace(/\n\s*\n+/g, "\n\n").split("\n").map((line, lineIndex) => {
    const bullet = /^\s*[-*•]\s+/.test(line);
    const content = line.replace(/^\s*[-*•]\s+/, "");
    const parts = content.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
      part.startsWith("**") && part.endsWith("**") ? <b key={index}>{part.slice(2, -2)}</b> : <span key={index}>{part}</span>,
    );
    if (!line.trim()) return <span key={lineIndex} className="block h-1" aria-hidden="true" />;
    return bullet ? (
      <p key={lineIndex} className="flex gap-1.5">
        <span aria-hidden="true">•</span>
        <span>{parts}</span>
      </p>
    ) : (
      <p key={lineIndex}>{parts}</p>
    );
  });
}

/** Tombol mengambang + panel chat asisten AI "Si Jeruk". */
export function AssistantWidget({ role }: { role: UserRole | null }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ChatItem[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [items.length, pending]);

  // Di dalam ruang chat petani–UMKM, tombol mengambang menutupi kolom pesan
  const pathname = usePathname();
  const inChatRoom = /\/chat\/[^/]+$/.test(pathname) && !pathname.includes("/chat/mulai/");

  const send = (text: string) => {
    const question = text.trim();
    if (!question || pending) return;
    const next: ChatItem[] = [...items, { role: "user", text: question }];
    setItems(next);
    setDraft("");
    startTransition(async () => {
      const history = next.filter((item) => !item.error).map(({ role, text }) => ({ role, text }));
      const reply = await askAssistant(history);
      setItems((current) => [
        ...current,
        reply.ok ? { role: "assistant", text: reply.text, links: reply.links } : { role: "assistant", text: reply.message, error: true },
      ]);
    });
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    send(draft);
  };

  if (inChatRoom) return null;

  return (
    <div className="print:hidden">
      {open && (
        <section
          role="dialog"
          aria-label="Asisten AI Si Jeruk"
          className="fixed bottom-24 right-4 z-50 flex h-[min(560px,calc(100vh-8rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-leaf-200"
        >
          <header className="flex items-center gap-3 bg-leaf-700 px-4 py-3 text-white">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-leaf-50">
              <Image src="/images/mascot/point.png" alt="" width={60} height={80} className="mt-4 w-12" />
            </span>
            <div className="flex-1">
              <p className="font-bold leading-tight">Si Jeruk</p>
              <p className="text-xs text-leaf-100">Asisten AI Agriloss · didukung Gemini</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Tutup asisten" className="rounded-full p-2 hover:bg-white/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-leaf-50 p-4 text-sm" aria-live="polite">
            <div className="max-w-[90%] rounded-2xl rounded-bl-sm bg-white p-3 shadow-sm">
              Halo! Aku <b>Si Jeruk</b>. Tanya apa saja tentang Agriloss.Connect — cara menjual hasil panen, mencari bahan baku, atau produk olahan.
            </div>
            {items.length === 0 && (
              <div className="flex flex-col gap-2">
                {SUGGESTIONS[role ?? "guest"].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    className="w-fit rounded-full border border-leaf-300 bg-white px-3 py-1.5 text-left text-xs font-medium text-leaf-800 hover:bg-leaf-100"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            {items.map((item, index) => (
              <div key={index} className={cn("flex flex-col gap-2", item.role === "user" ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "max-w-[90%] space-y-1 rounded-2xl p-3 shadow-sm",
                    item.role === "user" ? "rounded-br-sm bg-leaf-700 text-white" : item.error ? "rounded-bl-sm bg-red-50 text-red-800" : "rounded-bl-sm bg-white",
                  )}
                >
                  {item.role === "assistant" ? renderText(item.text) : item.text}
                </div>
                {item.links && item.links.length > 0 && (
                  <div className="flex max-w-[90%] flex-col gap-1.5">
                    {item.links.map((link) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="rounded-xl bg-lime/70 px-3 py-2 text-xs font-semibold text-ink hover:bg-lime"
                      >
                        {link.label} →
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {pending && (
              <div className="w-fit rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm" role="status">
                <span className="inline-flex gap-1" aria-label="Si Jeruk sedang mengetik">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-leaf-500 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-leaf-500 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-leaf-500" />
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-leaf-200 p-3">
            <label htmlFor="assistant-input" className="sr-only">
              Tanya Si Jeruk
            </label>
            <textarea
              ref={inputRef}
              id="assistant-input"
              rows={1}
              maxLength={1000}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send(draft);
                }
              }}
              placeholder="Tanya Si Jeruk…"
              className="max-h-28 min-h-10 flex-1 resize-none rounded-2xl bg-field px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-leaf-700"
            />
            <button
              type="submit"
              disabled={!draft.trim() || pending}
              aria-label="Kirim pertanyaan"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-leaf-700 text-white hover:bg-leaf-800 disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" />
              </svg>
            </button>
          </form>
          <p className="bg-white px-3 pb-2 text-center text-[10px] text-neutral-500">AI bisa keliru. Periksa kembali informasi penting.</p>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Tutup Si Jeruk" : "Tanya Si Jeruk (asisten AI)"}
        className={cn(
          "group fixed bottom-5 right-4 z-50 flex items-center gap-2 rounded-full bg-leaf-700 p-2 text-white shadow-2xl ring-4 ring-lime/60 transition hover:-translate-y-0.5 hover:bg-leaf-800 hover:pr-4",
          open && "pr-4",
        )}
      >
        <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-leaf-50">
          <Image src="/images/mascot/point.png" alt="" width={66} height={88} className="mt-5 w-14 transition group-hover:scale-110" />
        </span>
        <span className={cn("text-sm font-bold", open ? "inline" : "hidden group-hover:inline group-focus-visible:inline")}>
          {open ? "Tutup" : "Tanya Si Jeruk"}
        </span>
      </button>
    </div>
  );
}
