import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, PageTitle } from "@/components/ui/Container";
import { ProductForm } from "@/features/products/components/ProductForm";
import { getProduct } from "@/features/products/queries";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Ubah Produk" };

export default async function EditProductPage({ params }: PageProps<"/dashboard/umkm/katalog/[id]">) {
  const profile = await requireRole("umkm");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const product = await getProduct(id, profile.id);
  if (!product) notFound();

  return (
    <Container className="pt-6 sm:pt-10">
      <Link href="/dashboard/umkm/katalog" className="mb-4 inline-block text-sm font-semibold text-leaf-800 hover:underline">
        ← Kembali ke katalog
      </Link>
      <PageTitle title="Ubah Produk" description={product.name} />
      <section className="rounded-4xl bg-white/50 p-5 shadow-card sm:p-8">
        <ProductForm product={product} />
      </section>
    </Container>
  );
}
