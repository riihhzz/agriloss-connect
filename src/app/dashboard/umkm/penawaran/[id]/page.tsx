import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, PageTitle } from "@/components/ui/Container";
import { ProductImage } from "@/components/ui/ProductImage";
import { AcceptOfferForm, DecisionPanel } from "@/features/offers/components/OfferDecision";
import { OfferDetailTable } from "@/features/offers/components/OfferDetailTable";
import { StatusBadge } from "@/features/offers/components/StatusBadge";
import { getOfferDetail } from "@/features/offers/queries";
import { getBalance, getPendingPaymentForOffer } from "@/features/payments/queries";
import { requireRole } from "@/lib/auth";
import { LinkButton } from "@/components/ui/Button";
import { PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { cn, dateFromToday, formatRupiah } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Detail Penawaran" };

export default async function OfferDetailPage({ params }: PageProps<"/dashboard/umkm/penawaran/[id]">) {
  const profile = await requireRole("umkm");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  // RLS: UMKM hanya bisa melihat penawaran terbuka atau yang ia terima sendiri.
  const offer = await getOfferDetail(id);
  if (!offer) notFound();

  const isMine = offer.accepted_by === profile.id;
  const chatHref = `/dashboard/umkm/chat/mulai/${offer.id}`;
  const subtotal = Math.round(offer.quantity_kg * offer.price_per_kg);
  const awaitingPayment = offer.status === "diterima" && isMine;
  const [balance, pendingPayment] = awaitingPayment
    ? await Promise.all([getBalance(profile.id), getPendingPaymentForOffer(offer.id)])
    : [0, null];

  return (
    <Container className="pt-6 sm:pt-10">
      <Link href="/dashboard/umkm/penawaran" className="mb-4 inline-block text-sm font-semibold text-leaf-800 hover:underline">
        ← Kembali ke daftar penawaran
      </Link>
      <PageTitle title="Detail Penawaran" action={<StatusBadge status={offer.status} className="text-sm" />} />

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <ProductImage
          src={offer.photo_url}
          alt={`Kondisi ${offer.fruit_type}`}
          // Tanpa foto: kotak lebih pendek di HP agar panel pembayaran tidak terdorong jauh ke bawah
          className={cn("rounded-3xl border-2 border-leaf-900 bg-white", !offer.photo_url && "aspect-[2/1] lg:aspect-square")}
        />
        <div className="flex flex-col gap-6">
          <OfferDetailTable offer={offer} />
          {offer.status === "menawarkan" && (
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <AcceptOfferForm offerId={offer.id} />
              <LinkButton href={chatHref} variant="outline" size="lg" className="w-full rounded-2xl bg-white/60 sm:w-60">
                <Icon name="chat" /> Tanya Petani Dulu
              </LinkButton>
            </div>
          )}
          {offer.status === "selesai" && isMine && (
            <div className="rounded-xl bg-lime/60 px-4 py-3 text-sm">
              <p className="font-semibold">
                Transaksi selesai &amp; lunas. Bahan baku sudah tercatat di{" "}
                <Link href="/dashboard/umkm/stok" className="underline">
                  Stok
                </Link>
                .
              </p>
              {offer.total_paid !== null && (
                <p className="mt-1">
                  Dibayar {formatRupiah(offer.total_paid)}
                  {offer.payment_method ? ` via ${PAYMENT_METHOD_LABEL[offer.payment_method]}` : ""} (termasuk biaya layanan{" "}
                  {formatRupiah(offer.service_fee ?? 0)}).
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {awaitingPayment && (
        <div className="mt-10">
          <DecisionPanel
            offerId={offer.id}
            subtotal={subtotal}
            chatHref={chatHref}
            defaultFresh={dateFromToday(offer.shelf_life_days ?? 5)}
            balance={balance}
            pendingPaymentHref={pendingPayment ? `/dashboard/umkm/pembayaran/${pendingPayment.id}` : null}
          />
        </div>
      )}
    </Container>
  );
}
