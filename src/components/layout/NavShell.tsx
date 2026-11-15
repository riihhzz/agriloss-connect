"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import type { NavItem } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Kerangka navbar responsif: logo kiri, menu tengah, aksi kanan.
 * Di layar kecil menu berubah menjadi panel yang menimpa halaman:
 * kartu akun di atas, daftar menu, lalu tombol aksi selebar layar.
 */
export function NavShell({
  items,
  actions,
  barActions,
  mobileHeader,
  mobileFooter,
  logoHref = "/",
  exactRoot,
}: {
  items: NavItem[];
  /** Aksi khusus desktop (mis. menu pengguna / tombol Masuk) */
  actions?: ReactNode;
  /** Ikon yang selalu tampil di bar atas, desktop maupun HP (chat, notifikasi) */
  barActions?: ReactNode;
  /** Isi bagian atas panel HP (kartu akun) */
  mobileHeader?: ReactNode;
  /** Isi bagian bawah panel HP (tombol Masuk / Keluar) */
  mobileFooter?: ReactNode;
  logoHref?: string;
  /** href yang hanya aktif bila path persis sama (mis. beranda dashboard) */
  exactRoot?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const close = () => setOpen(false);

  // Tutup panel setiap kali berpindah halaman
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const isActive = (href: string) => {
    if (href.includes("#")) return false;
    if (href === "/" || href === exactRoot) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 print:hidden bg-leaf-100/85 backdrop-blur supports-backdrop-filter:bg-leaf-100/70">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-8" aria-label="Navigasi utama">
        <Logo href={logoHref} />

        <ul className="hidden items-center gap-5 lg:flex xl:gap-8">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "text-[15px] transition hover:text-leaf-700",
                  isActive(item.href) ? "font-semibold text-leaf-700" : "text-ink",
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1 lg:gap-3">
          {barActions}
          <div className="hidden items-center gap-3 lg:flex">{actions}</div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-leaf-800 hover:bg-leaf-200 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            onClick={() => setOpen((value) => !value)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div className="lg:hidden">
          {/* Latar gelap: ketuk di luar panel untuk menutup */}
          <div className="absolute inset-x-0 top-full h-dvh bg-leaf-900/40" onClick={close} aria-hidden="true" />
          <div
            id="mobile-menu"
            className="absolute inset-x-0 top-full max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-b-3xl border-t border-leaf-200 bg-leaf-50 px-4 pb-5 pt-3 shadow-2xl"
          >
            {mobileHeader && <div className="mb-3">{mobileHeader}</div>}
            <ul className="flex flex-col gap-1">
              {items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={close}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center justify-between rounded-2xl px-4 py-3 text-base transition",
                        active ? "bg-leaf-700 font-semibold text-white" : "text-ink hover:bg-leaf-200/70",
                      )}
                    >
                      {item.label}
                      <svg className={active ? "opacity-90" : "opacity-40"} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m9 6 6 6-6 6" />
                      </svg>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {mobileFooter && <div className="mt-4 border-t border-leaf-200 pt-4">{mobileFooter}</div>}
          </div>
        </div>
      )}
    </header>
  );
}
