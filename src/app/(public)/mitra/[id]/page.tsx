import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { Mascot } from "@/components/ui/Mascot";
import { buttonClass } from "@/components/ui/Button";
import { ProductGrid } from "@/features/products/components/ProductCard";
import { getPublicProducts, getUmkmProfile } from "@/features/products/queries";
import { LocationMap } from "@/features/profile/components/LocationMap";
import { displayName } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

const UUID_RE = /^[0-9a-f-]{36}$/i;

export async function generateMetadata({ params }: PageProps<"/mitra/[id]">): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return {};
  const umkm = await getUmkmProfile(id);
  return umkm ? { title: `Katalog ${displayName(umkm)}`, description: umkm.description ?? undefined } : {};
}

/** Halaman katalog per UMKM — tujuan QR code di outlet/kemasan. */
export default async function PartnerCatalogPage({ params }: PageProps<"/mitra/[id]">) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const umkm = await getUmkmProfile(id);
  if (!umkm) notFound();

  const products = await getPublicProducts({ umkmId: id });
  const name = displayName(umkm);
  const hasCoords = umkm.latitude !== null && umkm.longitude !== null;
  const directions = hasCoords
    ? `https://www.openstreetmap.org/directions?to=${umkm.latitude}%2C${umkm.longitude}`
    : null;

  return (
    <Container className="pt-6 sm:pt-10">
      <section className="grid items-center gap-6 md:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-4">
          <p className="w-fit rounded-full bg-lime px-3 py-1 text-xs font-bold">UMKM Mitra Agriloss.Connect</p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Selamat datang di <span className="text-leaf-700">{name}</span>
          </h1>
          {umkm.description && <p className="max-w-xl text-neutral-800">{umkm.description}</p>}
          <p className="text-sm text-neutral-700">
            <Icon name="pin" size={16} className="text-leaf-700" /> {umkm.location ?? "Lokasi belum diisi"}
          </p>
          <p className="max-w-xl text-sm text-neutral-700">
            Produk di sini diolah dari buah lokal yang hampir terbuang. Kunjungi outlet untuk membeli langsung.
          </p>
        </div>
        <div className="hidden justify-center md:flex">
          <Mascot pose="wave" width={260} priority animated />
        </div>
      </section>

      <section className="mt-12" aria-label={`Produk ${name}`}>
        <h2 className="mb-6 text-2xl font-bold sm:text-3xl">Produk ({products.length})</h2>
        {products.length > 0 ? (
          <ProductGrid products={products} showUmkm={false} />
        ) : (
          <EmptyState title="Belum ada produk" description={`${name} belum menambahkan produk ke katalog.`} />
        )}
      </section>

      <section className="mt-12" aria-labelledby="lokasi-outlet">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 id="lokasi-outlet" className="text-2xl font-bold sm:text-3xl">
            Lokasi Outlet
          </h2>
          {directions && (
            <a href={directions} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "md")}>
              <Icon name="compass" /> Petunjuk Arah
            </a>
          )}
        </div>
        <LocationMap latitude={umkm.latitude} longitude={umkm.longitude} label={`${name} · ${umkm.location ?? ""}`} />
      </section>
    </Container>
  );
}
