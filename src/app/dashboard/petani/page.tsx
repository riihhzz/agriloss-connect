import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { DashboardHero } from "@/features/dashboard/components/DashboardHero";
import { OfferForm } from "@/features/offers/components/OfferForm";
import { OfferHistoryList } from "@/features/offers/components/OfferHistoryList";
import { getMyOffers } from "@/features/offers/queries";
import { getMyStats } from "@/features/stats/queries";
import { requireRole } from "@/lib/auth";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Beranda Petani" };

export default async function PetaniHomePage() {
  const profile = await requireRole("petani");
  const [stats, offers] = await Promise.all([getMyStats(), getMyOffers(profile.id, { limit: 3 })]);

  return (
    <Container className="pt-6 sm:pt-10">
      <DashboardHero
        greeting={`Hallo, ${profile.full_name.split(" ")[0]}`}
        description="Selamat datang di Agriloss.Connect. Mari kelola penawaran hasil panenmu."
        stats={[
          { value: formatNumber(stats.statA), label: "Penawaran Aktif" },
          { value: formatNumber(stats.statB), label: "Diterima UMKM" },
          { value: `${formatNumber(stats.savedKg)} Kg`, label: "Food Loss Diselamatkan" },
        ]}
      />

      <section className="mt-16 sm:mt-24" aria-labelledby="tambah-title">
        <h2 id="tambah-title" className="mb-6 text-3xl font-bold sm:text-4xl">
          Tambah Penawaran
        </h2>
        <OfferForm defaultLocation={profile.location} />
      </section>

      <section className="mt-16 sm:mt-24" aria-labelledby="riwayat-title">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 id="riwayat-title" className="text-3xl font-bold sm:text-4xl">
            Riwayat Penawaran Saya
          </h2>
          <LinkButton href="/dashboard/petani/riwayat" variant="lime">
            Live Progres
          </LinkButton>
        </div>
        {offers.length > 0 ? (
          <OfferHistoryList offers={offers} />
        ) : (
          <EmptyState title="Belum ada penawaran" description="Isi form di atas untuk menawarkan hasil panen pertamamu." />
        )}
      </section>
    </Container>
  );
}
