import Link from "next/link";
import { ProductImage } from "@/components/ui/ProductImage";
import { buttonClass } from "@/components/ui/Button";
import { MIN_SHELF_LIFE_DAYS, RIPENESS_LABEL } from "@/lib/constants";
import { cn, formatKg, formatRupiah, savingsPercent } from "@/lib/utils";
import type { OfferWithPetani } from "@/types/database";
import { Icon } from "@/components/ui/Icon";

/** Kartu penawaran petani yang dilihat UMKM: harga, hemat %, masa layak, petani, lokasi. */
export function OpenOfferCard({ offer, distanceKm }: { offer: OfferWithPetani; distanceKm?: number | null }) {
  const saving = savingsPercent(offer.price_per_kg, offer.market_price_per_kg);
  const shelf = offer.shelf_life_days;

  return (
    <article className="card-lime flex flex-col gap-3 rounded-4xl border border-white/70 p-4 shadow-card transition hover:-translate-y-1">
      <div className="relative">
        <ProductImage src={offer.photo_url} alt={`Kondisi ${offer.fruit_type}`} />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-leaf-800">
          {RIPENESS_LABEL[offer.ripeness]}
        </span>
        {saving !== null && (
          <span className="absolute right-3 top-3 rounded-full bg-sun px-3 py-1 text-xs font-bold text-white">Hemat {saving}%</span>
        )}
      </div>
      <div className="flex items-end justify-between gap-3 px-1">
        <div className="min-w-0">
          <h3 className="truncate text-xl font-bold sm:text-2xl">{offer.fruit_type}</h3>
          <p className="text-sm">
            <b>{formatRupiah(offer.price_per_kg)}</b>/Kg
            {offer.market_price_per_kg ? (
              <span className="ml-1 text-xs text-neutral-500 line-through">{formatRupiah(offer.market_price_per_kg)}</span>
            ) : null}{" "}
            · {formatKg(offer.quantity_kg)}
          </p>
          <p className="text-xs text-neutral-700">
            {offer.petani?.full_name ?? "Petani"} · {offer.location}
            {distanceKm != null && ` · ${distanceKm < 1 ? "<1" : Math.round(distanceKm)} km`}
          </p>
          {shelf !== null && (
            <p className={cn("mt-1 text-xs font-semibold", shelf < MIN_SHELF_LIFE_DAYS ? "text-red-700" : "text-leaf-800")}>
              <Icon name="clock" size={14} /> Layak diolah ±{shelf} hari
            </p>
          )}
        </div>
        <Link href={`/dashboard/umkm/penawaran/${offer.id}`} className={buttonClass("primary", "sm", "shrink-0 rounded-2xl")}>
          Detail
        </Link>
      </div>
    </article>
  );
}
