import { MIN_SHELF_LIFE_DAYS, RIPENESS_LABEL } from "@/lib/constants";
import { formatDate, formatKg, formatRupiah, savingsPercent } from "@/lib/utils";
import type { OfferWithPetani } from "@/types/database";

/** Tabel "Detail Penawaran": Petani, Lokasi, Komoditas, Jumlah, Harga, Total. */
export function OfferDetailTable({ offer }: { offer: OfferWithPetani }) {
  const rows: Array<[string, string]> = [
    ["Petani", offer.petani?.full_name ?? "-"],
    ["Lokasi", offer.location],
    ["Komoditas", offer.fruit_type],
    ["Kematangan", RIPENESS_LABEL[offer.ripeness]],
    ["Jumlah", formatKg(offer.quantity_kg)],
    ["Harga (/Kg)", formatRupiah(offer.price_per_kg)],
  ];
  const saving = savingsPercent(offer.price_per_kg, offer.market_price_per_kg);
  if (offer.market_price_per_kg) {
    rows.push(["Harga pasar (/Kg)", `${formatRupiah(offer.market_price_per_kg)}${saving !== null ? ` — hemat ${saving}%` : ""}`]);
  }
  if (offer.shelf_life_days !== null) {
    rows.push(["Masih layak diolah", `±${offer.shelf_life_days} hari${offer.shelf_life_days < MIN_SHELF_LIFE_DAYS ? " (segera olah)" : ""}`]);
  }
  rows.push(["Total", formatRupiah(offer.quantity_kg * offer.price_per_kg)], ["Dikirim", formatDate(offer.created_at, true)]);
  if (offer.notes) rows.push(["Catatan", offer.notes]);

  return (
    <div className="overflow-hidden rounded-xl border-2 border-leaf-900 bg-white">
      <table className="w-full text-sm">
        <caption className="sr-only">Detail penawaran {offer.fruit_type}</caption>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-leaf-900/70 last:border-b-0">
              <th scope="row" className="w-2/5 border-r-2 border-leaf-900 bg-leaf-50 px-4 py-3 text-left font-semibold">
                {label}
              </th>
              <td className={label === "Total" ? "px-4 py-3 font-bold text-leaf-800" : "px-4 py-3"}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
