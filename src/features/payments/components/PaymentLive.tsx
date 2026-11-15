"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

/**
 * Hitung mundur batas bayar + cek status otomatis.
 * Saat simulator (mis. di HP lain) melunasi tagihan, halaman ini ikut berubah
 * tanpa perlu dimuat ulang, seperti menunggu notifikasi dari payment gateway.
 */
export function PaymentLive({ secondsLeft, cash = false }: { secondsLeft: number; cash?: boolean }) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [lastProp, setLastProp] = useState(secondsLeft);

  // Setiap kali server mengirim sisa waktu terbaru (refresh berkala), mulai hitung lagi dari angka itu
  if (secondsLeft !== lastProp) {
    setLastProp(secondsLeft);
    setElapsed(0);
  }

  useEffect(() => {
    const tick = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    const poll = window.setInterval(() => router.refresh(), 3000);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(poll);
    };
  }, [router]);

  const left = Math.max(0, secondsLeft - elapsed);
  const hours = Math.floor(left / 3600);
  const minutes = Math.floor((left % 3600) / 60);
  const seconds = left % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  const urgent = left < 120;

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">{cash ? "Tagihan tunai berlaku" : "Selesaikan pembayaran dalam"}</p>
      <p className={cn("font-mono text-3xl font-bold tabular-nums", urgent ? "text-red-600" : "text-leaf-800")} aria-live="off">
        {`${hours > 0 ? `${pad(hours)}:` : ""}${pad(minutes)}:${pad(seconds)}`}
      </p>
      <p className="flex items-center gap-1.5 text-xs text-neutral-600" role="status">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sun opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-sun" />
        </span>
        {cash ? "Menunggu konfirmasi petani…" : "Menunggu pembayaran…"} halaman ini diperbarui otomatis
      </p>
    </div>
  );
}

/** Tombol salin (nomor Virtual Account). */
export function CopyButton({ value, label = "Salin" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard tidak tersedia: abaikan */
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-full bg-leaf-100 px-3 py-1.5 text-xs font-bold text-leaf-800 hover:bg-leaf-200"
    >
      <Icon name={copied ? "check" : "copy"} size={14} />
      {copied ? "Tersalin" : label}
    </button>
  );
}
