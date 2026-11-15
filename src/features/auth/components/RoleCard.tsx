import Link from "next/link";
import { RoleIcon } from "@/features/auth/components/RoleIcon";
import type { UserRole } from "@/types/database";

/** Kartu pilihan peran pada halaman "Pilih Peran". */
export function RoleCard({ href, role, title, description }: { href: string; role: UserRole; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-4 rounded-[2.5rem] bg-gradient-to-b from-leaf-400 to-leaf-600 px-8 py-8 text-center text-white shadow-card transition hover:-translate-y-1 hover:shadow-xl focus-visible:outline-4 focus-visible:outline-lime"
    >
      <span className="flex h-28 w-28 items-center justify-center rounded-full bg-leaf-50 shadow-inner ring-4 ring-white/40 transition group-hover:scale-105">
        <RoleIcon role={role} size={80} />
      </span>
      <span className="text-2xl font-bold sm:text-3xl">{title}</span>
      <span className="text-sm text-leaf-50/90">{description}</span>
    </Link>
  );
}
