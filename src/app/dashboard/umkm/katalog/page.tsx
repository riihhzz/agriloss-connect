import type { Metadata } from "next";
import { Container, PageTitle } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { MyProductList } from "@/features/products/components/MyProductList";
import { ProductForm } from "@/features/products/components/ProductForm";
import { getMyProducts } from "@/features/products/queries";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Katalog Saya" };

export default async function UmkmCatalogPage() {
  const profile = await requireRole("umkm");
  const products = await getMyProducts(profile.id);

  return (
    <Container className="pt-6 sm:pt-10">
      <PageTitle
        title="Katalog Produk"
        description="Kelola produk olahan usaha kamu."
        action={
          <LinkButton href={`/mitra/${profile.id}`} variant="outline" className="bg-white/50" target="_blank">
            Lihat halaman publik ↗
          </LinkButton>
        }
      />

      <section className="rounded-4xl bg-white/50 p-5 shadow-card sm:p-8" aria-labelledby="tambah-katalog">
        <h2 id="tambah-katalog" className="mb-6 text-2xl font-bold sm:text-3xl">
          Tambah Katalog
        </h2>
        <ProductForm />
      </section>

      <section className="mt-14" aria-labelledby="produk-saya">
        <h2 id="produk-saya" className="mb-6 text-2xl font-bold sm:text-3xl">
          Produk Saya ({products.length})
        </h2>
        {products.length > 0 ? (
          <MyProductList products={products} />
        ) : (
          <EmptyState title="Katalog masih kosong" description="Tambahkan produk olahan pertamamu melalui form di atas." />
        )}
      </section>
    </Container>
  );
}
