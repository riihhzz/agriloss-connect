"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { logout } from "@/features/auth/actions";
import { cn, formatRupiah } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

/** Foto + nama pengguna di navbar, dengan menu Profil / Chat / Keluar. */
export function UserMenu({
  name,
  avatarUrl,
  roleLabel,
  basePath,
  balance,
}: {
  name: string;
  avatarUrl: string | null;
  roleLabel: string;
  basePath: string;
  /** Saldo Agriloss; bila diisi tampil di menu seperti dompet digital */
  balance?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full bg-leaf-700 py-1 pl-1 pr-3 text-white transition hover:bg-leaf-800"
      >
        <Avatar name={name} url={avatarUrl} size={32} className="ring-2 ring-white/40" />
        <span className="max-w-32 truncate text-sm font-semibold">{name}</span>
        <svg className={cn("transition", open && "rotate-180")} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl bg-white text-ink shadow-card">
          <div className="border-b border-neutral-100 px-4 py-3">
            <p className="truncate font-bold">{name}</p>
            <p className="text-xs text-neutral-600">{roleLabel}</p>
          </div>
          {balance !== undefined && (
            <Link
              role="menuitem"
              href={`${basePath}/saldo`}
              onClick={() => setOpen(false)}
              className="mx-3 my-2 flex items-center justify-between gap-3 rounded-xl bg-leaf-700 px-3 py-2.5 text-white hover:bg-leaf-800"
            >
              <span className="flex items-center gap-2 text-xs font-semibold">
                <Icon name="wallet" /> Saldo Agriloss
              </span>
              <span className="text-sm font-bold">{formatRupiah(balance)}</span>
            </Link>
          )}
          <Link role="menuitem" href={`${basePath}/profil`} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-leaf-100">
            <Icon name="user" className="text-leaf-700" /> Profil Saya
          </Link>
          <Link role="menuitem" href={`${basePath}/chat`} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-leaf-100">
            <Icon name="chat" className="text-leaf-700" /> Chat
          </Link>
          <form action={logout} className="border-t border-neutral-100">
            <ConfirmSubmit
              title="Keluar dari akun?"
              message="Kamu perlu masuk kembali untuk mengelola penawaran dan data akunmu."
              confirmLabel="Ya, keluar"
              cancelLabel="Tetap di sini"
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-red-700 hover:bg-red-50"
            >
              <Icon name="logout" /> Keluar
            </ConfirmSubmit>
          </form>
        </div>
      )}
    </div>
  );
}

/** Kartu akun di bagian atas menu HP: foto, nama, peran, menuju halaman profil. */
export function MobileAccountCard({
  name,
  avatarUrl,
  roleLabel,
  basePath,
}: {
  name: string;
  avatarUrl: string | null;
  roleLabel: string;
  basePath: string;
}) {
  return (
    <Link href={`${basePath}/profil`} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-leaf-200 transition hover:bg-leaf-100">
      <Avatar name={name} url={avatarUrl} size={44} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold leading-tight">{name}</span>
        <span className="block truncate text-xs text-neutral-600">{roleLabel}</span>
      </span>
      <svg className="shrink-0 text-leaf-700" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m9 6 6 6-6 6" />
      </svg>
    </Link>
  );
}

/** Tombol Keluar selebar layar untuk menu HP. */
export function MobileLogout() {
  return (
    <form action={logout}>
      <ConfirmSubmit
        title="Keluar dari akun?"
        message="Kamu perlu masuk kembali untuk mengelola penawaran dan data akunmu."
        confirmLabel="Ya, keluar"
        cancelLabel="Tetap di sini"
        className="flex w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50"
      >
        <Icon name="logout" /> Keluar
      </ConfirmSubmit>
    </form>
  );
}
