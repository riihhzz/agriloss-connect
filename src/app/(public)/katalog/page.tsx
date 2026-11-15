import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { Highlight, SectionHeading } from "@/components/ui/SectionHeading";
import { CatalogFilters } from "@/features/products/components/CatalogFilters";
import { ProductGrid } from "@/features/products/components/ProductCard";
import { getProductFruits, getPublicProducts, getUmkmPartners, type ProductSort } from "@/features/products/queries";
import { PRODUCT_CATEGORY_LABEL } from "@/lib/constants";
import { displayName } from "@/lib/utils";
import type { ProductCategory } from "@/types/database";

export const metadata: Metadata = {
  title: "Katalog Produk Olahan",
  description: "Produk olahan buah lokal dari UMKM mitra Agriloss.Connect.",
};

const text = (value: string | string[] | undefined) => (typeof value === "string" && value.trim() ? value.trim() : undefined);
const num = (value: string | string[] | undefined) => {
  const parsed = Number(text(value));
  return Number.isFinite(parsed) && parsed >= 0 && text(value) ? parsed : undefined;
};

export default async function CatalogPage({ searchParams }: PageProps<"/katalog">) {
  const params = await searchParams;
  const category = text(params.kategori);
  const sort = text(params.urut);

  const filters = {
    query: text(params.q),
    umkmId: text(params.umkm),
    category: category && category in PRODUCT_CATEGORY_LABEL ? (category as ProductCategory) : undefined,
    fruit: text(params.buah),
    minPrice: num(params.min),
    maxPrice: num(params.max),
    sort: sort === "termurah" || sort === "termahal" ? (sort as ProductSort) : undefined,
  };

  const [products, partners, fruits] = await Promise.all([getPublicProducts(filters), getUmkmPartners(), getProductFruits()]);

  return (
    <Container className="pt-8 sm:pt-12">
      <SectionHeading
        title={
          <>
            Katalog <Highlight>Produk</Highlight> Olahan
          </>
        }
        description="Produk olahan UMKM mitra dari buah lokal yang terselamatkan dari food loss. Setiap pembelian ikut mengurangi buah yang terbuang."
      />
      <Suspense>
        <CatalogFilters
          fruits={fruits}
          umkms={partners.map((partner) => ({ value: partner.id, label: displayName(partner) }))}
          total={products.length}
        />
      </Suspense>
      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <EmptyState
          pose="confused"
          title="Produk tidak ditemukan"
          description="Coba ubah kata kunci atau hapus beberapa filter."
        />
      )}
    </Container>
  );
}
