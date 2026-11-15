import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { OfferForm } from "@/features/offers/components/OfferForm";
import { OfferHistoryList } from "@/features/offers/components/OfferHistoryList";
import { getMyOffers } from "@/features/offers/queries";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Penawaran" };

export default async function PetaniOffersPage() {
  const profile = await requireRole("petani");
  const activeOffers = await getMyOffers(profile.id, { status: "menawarkan" });

  return (
    <Container className="pt-6 sm:pt-10">
      <div className="mb-8 rounded-4xl bg-leaf-900 px-6 py-8 text-white sm:px-10">
        <h1 className="text-3xl font-bold sm:text-5xl">Tambah Penawaran</h1>
        <p className="mt-3 max-w-2xl text-lime">
          Sampaikan informasi hasil panen yang tersedia agar dapat ditemukan oleh UMKM yang membutuhkan bahan baku.
        </p>
      </div>

      <OfferForm defaultLocation={profile.location} />

      <section className="mt-16" aria-labelledby="aktif-title">
        <h2 id="aktif-title" className="text-3xl font-bold sm:text-4xl">
          Penawaran Aktif
        </h2>
        <p className="mb-6 mt-2 text-neutral-800">Penawaran yang sedang menunggu diterima UMKM.</p>
        {activeOffers.length > 0 ? (
          <OfferHistoryList offers={activeOffers} />
        ) : (
          <EmptyState title="Tidak ada penawaran aktif" description="Penawaran yang kamu kirim akan muncul di sini." />
        )}
      </section>
    </Container>
  );
}
