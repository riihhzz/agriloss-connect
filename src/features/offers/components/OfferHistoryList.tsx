import Link from "next/link";
import { withdrawOffer } from "@/features/offers/actions";
import { StatusBadge, StatusProgress } from "@/features/offers/components/StatusBadge";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { buttonClass } from "@/components/ui/Button";
import { PAYMENT_METHOD_LABEL, RIPENESS_LABEL } from "@/lib/constants";
import { displayName, formatDate, formatKg, formatRupiah, savingsPercent } from "@/lib/utils";
import type { OfferWithUmkm } from "@/types/database";
import { Icon } from "@/components/ui/Icon";

/** Riwayat penawaran petani (kartu hijau muda dengan status di kanan). */
export function OfferHistoryList({ offers }: { offers: OfferWithUmkm[] }) {
  return (
    <ul className="flex flex-col gap-4">
      {offers.map((offer) => {
        const umkmName = displayName(offer.umkm);
        const saving = savingsPercent(offer.price_per_kg, offer.market_price_per_kg);
        return (
          <li key={offer.id} className="rounded-xl bg-leaf-300/60 px-5 py-5 shadow-field sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-2xl font-bold">{offer.fruit_type}</h3>
                <p className="mt-1 text-sm">
                  {formatRupiah(offer.price_per_kg)}/Kg | {formatKg(offer.quantity_kg)} | {RIPENESS_LABEL[offer.ripeness]}
                  {saving !== null && <span className="ml-2 rounded-full bg-lime px-2 py-0.5 text-xs font-bold">Hemat {saving}%</span>}
                </p>
                <p className="mt-1 text-xs text-neutral-700">
                  Dikirim {formatDate(offer.created_at)}
                  {offer.shelf_life_days !== null && ` · layak ±${offer.shelf_life_days} hari`}
                </p>
                {offer.umkm && offer.status !== "menawarkan" && offer.status !== "dibatalkan" && (
                  <p className="mt-2 text-sm font-semibold text-blue-800">Diterima oleh {umkmName}</p>
                )}
                {offer.status === "selesai" && offer.subtotal !== null && (
                  <p className="mt-1 text-sm font-semibold text-leaf-800">
                    Pendapatan {formatRupiah(offer.subtotal)} — lunas
                    {offer.payment_method ? ` via ${PAYMENT_METHOD_LABEL[offer.payment_method]}` : ""}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-start gap-3 sm:items-end">
                <StatusBadge status={offer.status} />
                <StatusProgress status={offer.status} />
                <div className="flex gap-2">
                  {offer.accepted_by && offer.status !== "dibatalkan" && (
                    <Link href={`/dashboard/petani/chat/penawaran/${offer.id}?umkm=${offer.accepted_by}`} className={buttonClass("lime", "sm")}>
                      <Icon name="chat" size={16} /> Chat UMKM
                    </Link>
                  )}
                  {offer.status === "menawarkan" && (
                    <form action={withdrawOffer}>
                      <input type="hidden" name="id" value={offer.id} />
                      <ConfirmSubmit
                        title="Tarik penawaran?"
                        message={`Penawaran ${offer.fruit_type} ${formatKg(offer.quantity_kg)} tidak akan terlihat lagi oleh UMKM.`}
                        confirmLabel="Ya, tarik"
                        className={buttonClass("ghost", "sm", "text-red-700")}
                      >
                        Tarik Penawaran
                      </ConfirmSubmit>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
