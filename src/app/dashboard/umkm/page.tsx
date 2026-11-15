import type { Metadata } from "next";
import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { DashboardHero } from "@/features/dashboard/components/DashboardHero";
import { OpenOfferCard } from "@/features/offers/components/OpenOfferCard";
import { getOpenOffers, getPendingAcceptedOffers } from "@/features/offers/queries";
import { getMyStats } from "@/features/stats/queries";
import { requireRole } from "@/lib/auth";
import { formatKg, formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Beranda UMKM" };

export default async function UmkmHomePage() {
  const profile = await requireRole("umkm");
  const [stats, openOffers, pending] = await Promise.all([
    getMyStats(),
    getOpenOffers({ limit: 3 }),
    getPendingAcceptedOffers(profile.id),
  ]);

  return (
    <Container className="pt-6 sm:pt-10">
      <DashboardHero
        greeting={`Hallo, ${profile.business_name ?? profile.full_name}`}
        description="Selamat datang di Agriloss.Connect untuk mengelola kebutuhan bahan baku dan produk usahamu."
        stats={[
          { value: formatNumber(stats.statA), label: "Jumlah Produk" },
          { value: formatNumber(stats.statB), label: "Penawaran Tersedia" },
          { value: `${formatNumber(stats.savedKg)} Kg`, label: "Food Loss Diselamatkan" },
        ]}
      />

      {pending.length > 0 && (
        <section className="mt-12 rounded-4xl bg-leaf-900 p-6 text-white sm:p-8" aria-labelledby="pending-title">
          <h2 id="pending-title" className="text-2xl font-bold">
            Menunggu keputusanmu
          </h2>
          <p className="mt-1 text-sm text-leaf-100">Penawaran yang sudah kamu terima. Lanjutkan bila buah sudah diterima, atau batalkan.</p>
          <ul className="mt-4 flex flex-col gap-2">
            {pending.map((offer) => (
              <li key={offer.id}>
                <Link
                  href={`/dashboard/umkm/penawaran/${offer.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/10 px-4 py-3 hover:bg-white/20"
                >
                  <span>
                    <strong>{offer.fruit_type}</strong> · {formatKg(offer.quantity_kg)} dari {offer.petani?.full_name}
                  </span>
                  <span className="text-sm font-semibold text-lime">Tinjau →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-16" aria-labelledby="terbaru-title">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 id="terbaru-title" className="text-3xl font-bold sm:text-4xl">
            Penawaran Terbaru dari Petani
          </h2>
          <LinkButton href="/dashboard/umkm/penawaran" variant="lime">
            Lihat semua
          </LinkButton>
        </div>
        {openOffers.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {openOffers.map((offer) => (
              <OpenOfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        ) : (
          <EmptyState title="Belum ada penawaran" description="Penawaran hasil panen dari petani akan muncul di sini." />
        )}
      </section>
    </Container>
  );
}
