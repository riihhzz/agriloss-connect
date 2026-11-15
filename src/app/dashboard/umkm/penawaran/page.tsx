import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Container, PageTitle } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchBar } from "@/components/ui/SearchBar";
import { OpenOfferCard } from "@/features/offers/components/OpenOfferCard";
import { getOpenFruitTypes, getOpenOffers, getPendingAcceptedOffers } from "@/features/offers/queries";
import { requireRole } from "@/lib/auth";
import { cn, distanceKm, savingsPercent } from "@/lib/utils";
import type { OfferWithPetani } from "@/types/database";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Penawaran dari Petani" };

const SORTS = [
  { value: "terbaru", label: "Terbaru", icon: null },
  { value: "terdekat", label: "Terdekat", icon: "pin" },
  { value: "hemat", label: "Paling hemat", icon: "tag" },
  { value: "segera", label: "Segera diolah", icon: "clock" },
] as const;
type Sort = (typeof SORTS)[number]["value"];

export default async function UmkmOffersPage({ searchParams }: PageProps<"/dashboard/umkm/penawaran">) {
  const profile = await requireRole("umkm");
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : undefined;
  const fruit = typeof params.filter === "string" && params.filter ? params.filter : undefined;
  const sort: Sort = SORTS.some((option) => option.value === params.urut) ? (params.urut as Sort) : "terbaru";

  const [offers, fruits, pending] = await Promise.all([
    getOpenOffers({ query, fruit }),
    getOpenFruitTypes(),
    getPendingAcceptedOffers(profile.id),
  ]);

  const origin = profile.latitude !== null && profile.longitude !== null ? { lat: profile.latitude, lng: profile.longitude } : null;
  const distanceOf = (offer: OfferWithPetani) =>
    origin && offer.petani?.latitude != null && offer.petani?.longitude != null
      ? distanceKm(origin, { lat: offer.petani.latitude, lng: offer.petani.longitude })
      : null;

  const sorted = [...offers].sort((a, b) => {
    if (sort === "terdekat") return (distanceOf(a) ?? Infinity) - (distanceOf(b) ?? Infinity);
    if (sort === "hemat")
      return (savingsPercent(b.price_per_kg, b.market_price_per_kg) ?? -1) - (savingsPercent(a.price_per_kg, a.market_price_per_kg) ?? -1);
    if (sort === "segera") return (a.shelf_life_days ?? 99) - (b.shelf_life_days ?? 99);
    return 0; // terbaru: urutan dari database
  });

  const sortHref = (value: Sort) => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (fruit) next.set("filter", fruit);
    if (value !== "terbaru") next.set("urut", value);
    const qs = next.toString();
    return `/dashboard/umkm/penawaran${qs ? `?${qs}` : ""}`;
  };

  return (
    <Container className="pt-6 sm:pt-10">
      <PageTitle title="Penawaran dari Petani" description="Bahan baku buah lokal sisa musim dengan harga di bawah pasar — bantu petani mengurangi food loss." />

      {pending.length > 0 && (
        <section className="mb-10" aria-labelledby="diterima-title">
          <h2 id="diterima-title" className="mb-4 text-2xl font-bold">
            Sudah kamu terima — menunggu pembayaran
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map((offer) => (
              <OpenOfferCard key={offer.id} offer={offer} distanceKm={distanceOf(offer)} />
            ))}
          </div>
        </section>
      )}

      <Suspense>
        <SearchBar
          className="mb-4"
          placeholder="Cari buah atau lokasi, mis. melon, Ciwidey..."
          filterLabel="Filter jenis buah"
          filterOptions={fruits.map((name) => ({ value: name, label: name }))}
        />
      </Suspense>

      <nav aria-label="Urutkan penawaran" className="mb-8 flex flex-wrap gap-2">
        {SORTS.map((option) => (
          <Link
            key={option.value}
            href={sortHref(option.value)}
            scroll={false}
            aria-current={sort === option.value ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition",
              sort === option.value ? "bg-leaf-700 text-white" : "bg-white/70 hover:bg-white",
            )}
          >
            {option.icon && <Icon name={option.icon} size={16} />}
            {option.label}
          </Link>
        ))}
        {sort === "terdekat" && !origin && (
          <span className="self-center text-xs text-neutral-700">
            Atur lokasi usahamu di <Link href="/dashboard/umkm/profil" className="underline">Profil</Link> agar jarak bisa dihitung.
          </span>
        )}
      </nav>

      {sorted.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((offer) => (
            <OpenOfferCard key={offer.id} offer={offer} distanceKm={distanceOf(offer)} />
          ))}
        </div>
      ) : (
        <EmptyState
          pose="confused"
          title="Tidak ada penawaran"
          description={query || fruit ? "Coba kata kunci atau filter lain." : "Belum ada petani yang menawarkan hasil panen."}
        />
      )}
    </Container>
  );
}
