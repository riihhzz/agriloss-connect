"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

/**
 * Kolom pencarian + filter (gaya pill hijau muda + tombol lime "Semua").
 * Nilai disimpan di URL (?q=&filter=) sehingga bisa di-render di server.
 */
export function SearchBar({
  placeholder = "Cari...",
  filterOptions,
  filterLabel = "Filter",
  className,
}: {
  placeholder?: string;
  filterOptions?: Option[];
  filterLabel?: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [isPending, startTransition] = useTransition();

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  // debounce pencarian teks
  useEffect(() => {
    const current = params.get("q") ?? "";
    if (query === current) return;
    const timer = setTimeout(() => update("q", query.trim()), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row", className)} role="search">
      <div className="relative flex-1">
        <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-leaf-800/70" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-12 w-full rounded-full bg-leaf-300/70 pl-11 pr-4 text-sm shadow-field outline-none placeholder:text-leaf-900/60 focus:ring-2 focus:ring-leaf-700"
        />
        {isPending && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-leaf-800">Memuat…</span>}
      </div>
      {filterOptions && (
        <select
          aria-label={filterLabel}
          defaultValue={params.get("filter") ?? ""}
          onChange={(event) => update("filter", event.target.value)}
          className="select-chevron h-12 rounded-full bg-lime pl-6 text-sm font-semibold shadow-field outline-none focus:ring-2 focus:ring-leaf-700 sm:min-w-44"
        >
          <option value="">Semua</option>
          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
