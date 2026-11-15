import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { LinkButton } from "@/components/ui/Button";
import { displayName } from "@/lib/utils";
import type { UmkmPartner } from "@/features/products/queries";

/** Kartu UMKM mitra: logo/foto, nama usaha, lokasi. */
export function PartnerCard({ partner }: { partner: UmkmPartner }) {
  const name = displayName(partner);
  return (
    <Link
      href={`/mitra/${partner.id}`}
      className="card-glass group flex flex-col items-center gap-3 rounded-4xl border border-white/70 p-6 text-center shadow-card transition hover:-translate-y-1"
    >
      <Avatar name={name} url={partner.avatar_url} size={140} className="rounded-4xl" />
      <h3 className="text-xl font-bold group-hover:text-leaf-700 sm:text-2xl">{name}</h3>
      <p className="text-sm text-neutral-700">{partner.location ?? "Lokasi belum diisi"}</p>
      <p className="text-xs font-semibold text-leaf-700">{partner.product_count} produk</p>
    </Link>
  );
}

/** Kartu ajakan "Buka Peluang, Bangun Kolaborasi." */
export function JoinPartnerCard() {
  return (
    <div className="card-glass flex flex-col justify-between gap-6 rounded-4xl border border-white/70 p-6 shadow-card sm:p-8">
      <p className="text-2xl font-bold leading-snug sm:text-3xl">
        Buka Peluang,
        <br />
        Bangun Kolaborasi.
      </p>
      <LinkButton href="/daftar/umkm" variant="lime" size="sm" className="w-fit">
        Bergabung sebagai Mitra
      </LinkButton>
    </div>
  );
}
