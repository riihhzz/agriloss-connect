"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { PRODUCT_CATEGORY_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

type Option = { value: string; label: string };

const PRICE_PRESETS: Array<{ label: string; min?: number; max?: number }> = [
  { label: "< Rp15rb", max: 15000 },
  { label: "Rp15–25rb", min: 15000, max: 25000 },
  { label: "> Rp25rb", min: 25000 },
];

/**
 * Filter katalog: kategori (chip), cari, buah bahan baku, rentang harga, UMKM, urutan.
 * Semua disimpan di URL (?q=&kategori=&buah=&min=&max=&umkm=&urut=) agar bisa dibagikan.
 */
export function CatalogFilters({ fruits, umkms, total }: { fruits: string[]; umkms: Option[]; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [showMore, setShowMore] = useState(Boolean(params.get("buah") || params.get("umkm") || params.get("min") || params.get("max")));

  const update = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  // debounce kolom pencarian
  useEffect(() => {
    if (query === (params.get("q") ?? "")) return;
    const timer = setTimeout(() => update({ q: query.trim() || undefined }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const activeCategory = params.get("kategori") ?? "";
  const min = params.get("min") ?? "";
  const max = params.get("max") ?? "";
  const activeCount = ["kategori", "buah", "min", "max", "umkm", "q"].filter((key) => params.get(key)).length;

  return (
    <section aria-label="Filter katalog" className="mb-8 flex flex-col gap-4">
      {/* Kategori cepat */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="radiogroup" aria-label="Kategori produk">
        {[["", "Semua"], ...Object.entries(PRODUCT_CATEGORY_LABEL)].map(([value, label]) => (
          <button
            key={value || "semua"}
            type="button"
            role="radio"
            aria-checked={activeCategory === value}
            onClick={() => update({ kategori: value || undefined })}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
              activeCategory === value ? "bg-leaf-700 text-white" : "bg-white/70 hover:bg-white",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-leaf-800/70" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari produk, mis. es krim, selai, keripik…"
            aria-label="Cari produk"
            className="h-12 w-full rounded-full bg-leaf-300/70 pl-11 pr-4 text-sm shadow-field outline-none placeholder:text-leaf-900/60 focus:ring-2 focus:ring-leaf-700"
          />
        </div>
        <select
          aria-label="Urutkan"
          value={params.get("urut") ?? "terbaru"}
          onChange={(event) => update({ urut: event.target.value === "terbaru" ? undefined : event.target.value })}
          className="select-chevron h-12 rounded-full bg-white/80 pl-5 text-sm font-semibold shadow-field outline-none focus:ring-2 focus:ring-leaf-700"
        >
          <option value="terbaru">Urutkan: Terbaru</option>
          <option value="termurah">Harga: Termurah</option>
          <option value="termahal">Harga: Termahal</option>
        </select>
        <button
          type="button"
          onClick={() => setShowMore((value) => !value)}
          aria-expanded={showMore}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-lime px-6 text-sm font-semibold shadow-field hover:brightness-95"
        >
          <Icon name="sliders" /> Filter lainnya{activeCount > 0 ? ` (${activeCount})` : ""}
        </button>
      </div>

      {showMore && (
        <div className="grid gap-4 rounded-3xl bg-white/70 p-5 shadow-card sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Buah bahan baku
            <select
              value={params.get("buah") ?? ""}
              onChange={(event) => update({ buah: event.target.value || undefined })}
              className="select-chevron h-11 rounded-md bg-field pl-3 font-normal shadow-field outline-none focus:ring-2 focus:ring-leaf-700"
            >
              <option value="">Semua buah</option>
              {fruits.map((fruit) => (
                <option key={fruit} value={fruit}>
                  {fruit}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            UMKM
            <select
              value={params.get("umkm") ?? ""}
              onChange={(event) => update({ umkm: event.target.value || undefined })}
              className="select-chevron h-11 rounded-md bg-field pl-3 font-normal shadow-field outline-none focus:ring-2 focus:ring-leaf-700"
            >
              <option value="">Semua UMKM</option>
              {umkms.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="flex flex-col gap-1.5 text-sm font-semibold lg:col-span-2">
            <legend className="mb-1.5">Rentang harga (Rp)</legend>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                placeholder="Min"
                aria-label="Harga minimum"
                defaultValue={min}
                onBlur={(event) => update({ min: event.target.value || undefined })}
                className="h-11 w-full rounded-md bg-field px-3 font-normal shadow-field outline-none focus:ring-2 focus:ring-leaf-700"
              />
              <span aria-hidden="true">–</span>
              <input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                placeholder="Maks"
                aria-label="Harga maksimum"
                defaultValue={max}
                onBlur={(event) => update({ max: event.target.value || undefined })}
                className="h-11 w-full rounded-md bg-field px-3 font-normal shadow-field outline-none focus:ring-2 focus:ring-leaf-700"
              />
            </div>
            <div className="flex flex-wrap gap-2 font-normal">
              {PRICE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => update({ min: preset.min?.toString(), max: preset.max?.toString() })}
                  className="rounded-full bg-leaf-100 px-3 py-1 text-xs font-semibold hover:bg-leaf-200"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      <div className="flex items-center justify-between text-sm" aria-live="polite">
        <span className="text-neutral-700">{isPending ? "Memuat…" : `${total} produk ditemukan`}</span>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              startTransition(() => router.replace(pathname, { scroll: false }));
            }}
            className="font-semibold text-leaf-800 hover:underline"
          >
            Hapus semua filter
          </button>
        )}
      </div>
    </section>
  );
}
