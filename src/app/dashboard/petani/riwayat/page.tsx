import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageTitle } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { OfferHistoryList } from "@/features/offers/components/OfferHistoryList";
import { getMyOffers } from "@/features/offers/queries";
import { CashConfirmations } from "@/features/payments/components/CashConfirmations";
import { getPendingCashPayments } from "@/features/payments/queries";
import { requireRole } from "@/lib/auth";
import { STATUS_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { OfferStatus } from "@/types/database";

export const metadata: Metadata = { title: "Riwayat Penawaran" };

const FILTERS: Array<OfferStatus | "semua"> = ["semua", "menawarkan", "diterima", "selesai", "dibatalkan"];

export default async function PetaniHistoryPage({ searchParams }: PageProps<"/dashboard/petani/riwayat">) {
  const profile = await requireRole("petani");
  const { status } = await searchParams;
  const active = FILTERS.includes(status as OfferStatus) ? (status as OfferStatus) : "semua";
  const [offers, cashPayments] = await Promise.all([
    getMyOffers(profile.id, { status: active === "semua" ? undefined : active }),
    getPendingCashPayments(profile.id),
  ]);

  return (
    <Container className="pt-6 sm:pt-10">
      <PageTitle title="Riwayat Penawaran Saya" description="Pantau progres setiap penawaran: Menawarkan → Diterima → Selesai." />
      <CashConfirmations payments={cashPayments} />

      <nav aria-label="Filter status" className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Link
            key={filter}
            href={filter === "semua" ? "/dashboard/petani/riwayat" : `/dashboard/petani/riwayat?status=${filter}`}
            aria-current={active === filter ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              active === filter ? "bg-leaf-700 text-white" : "bg-white/60 hover:bg-white",
            )}
          >
            {filter === "semua" ? "Semua" : STATUS_LABEL[filter]}
          </Link>
        ))}
      </nav>

      {offers.length > 0 ? (
        <OfferHistoryList offers={offers} />
      ) : (
        <EmptyState title="Belum ada riwayat" description="Penawaran dengan status ini belum ada." />
      )}
    </Container>
  );
}
