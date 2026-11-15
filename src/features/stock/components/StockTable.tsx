import { UsageForm } from "@/features/stock/components/UsageForm";
import { cn, formatDate, formatKg } from "@/lib/utils";
import type { Stock } from "@/types/database";

/** Sisa hari kesegaran → label & warna. */
function freshness(freshUntil: string | null) {
  if (!freshUntil) return { label: "-", tone: "text-neutral-600" };
  const days = Math.ceil((new Date(freshUntil).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { label: `Lewat ${Math.abs(days)} hari`, tone: "text-red-700 font-semibold" };
  if (days <= 1) return { label: days === 0 ? "Hari ini" : "Besok", tone: "text-sun font-semibold" };
  return { label: `${days} hari lagi`, tone: "text-leaf-800" };
}

/** Tabel "Stok Bahan Baku" (desktop) dan kartu (mobile). */
export function StockTable({ stocks }: { stocks: Stock[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl bg-white/80 shadow-card md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Stok bahan baku</caption>
          <thead className="bg-leaf-700 text-white">
            <tr>
              {["Petani", "Komoditas Buah", "Jumlah", "Terpakai", "Sisa", "Estimasi Kesegaran", "Input Penggunaan"].map((head) => (
                <th key={head} scope="col" className="px-4 py-3 font-semibold">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => {
              const remaining = stock.quantity_kg - stock.used_kg;
              const fresh = freshness(stock.fresh_until);
              return (
                <tr key={stock.id} className="border-b border-leaf-200 last:border-b-0 even:bg-leaf-50/60">
                  <td className="px-4 py-3">{stock.petani_name}</td>
                  <td className="px-4 py-3 font-semibold">{stock.fruit_type}</td>
                  <td className="px-4 py-3">{formatKg(stock.quantity_kg)}</td>
                  <td className="px-4 py-3">{formatKg(stock.used_kg)}</td>
                  <td className={cn("px-4 py-3 font-bold", remaining <= 0 ? "text-neutral-500" : "text-leaf-800")}>{formatKg(remaining)}</td>
                  <td className="px-4 py-3">
                    <span className={fresh.tone}>{fresh.label}</span>
                    {stock.fresh_until && <span className="block text-xs text-neutral-500">{formatDate(stock.fresh_until)}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <UsageForm stockId={stock.id} remaining={remaining} fruit={stock.fruit_type} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-4 md:hidden">
        {stocks.map((stock) => {
          const remaining = stock.quantity_kg - stock.used_kg;
          const fresh = freshness(stock.fresh_until);
          return (
            <li key={stock.id} className="rounded-2xl bg-white/80 p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">{stock.fruit_type}</h3>
                  <p className="text-xs text-neutral-600">dari {stock.petani_name}</p>
                </div>
                <span className={cn("text-sm", fresh.tone)}>{fresh.label}</span>
              </div>
              <dl className="my-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-leaf-50 p-2"><dt>Jumlah</dt><dd className="font-semibold">{formatKg(stock.quantity_kg)}</dd></div>
                <div className="rounded-lg bg-leaf-50 p-2"><dt>Terpakai</dt><dd className="font-semibold">{formatKg(stock.used_kg)}</dd></div>
                <div className="rounded-lg bg-lime/50 p-2"><dt>Sisa</dt><dd className="font-bold">{formatKg(remaining)}</dd></div>
              </dl>
              <UsageForm stockId={stock.id} remaining={remaining} fruit={stock.fruit_type} />
            </li>
          );
        })}
      </ul>
    </>
  );
}
