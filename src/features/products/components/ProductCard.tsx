import Link from "next/link";
import { ProductImage } from "@/components/ui/ProductImage";
import { PRODUCT_CATEGORY_LABEL } from "@/lib/constants";
import { displayName, formatRupiah } from "@/lib/utils";
import type { ProductWithUmkm } from "@/types/database";
import { Icon } from "@/components/ui/Icon";

/** Kartu produk katalog publik: foto, UMKM, kategori, buah bahan baku, harga, tautan ke toko. */
export function ProductCard({ product, showUmkm = true }: { product: ProductWithUmkm; showUmkm?: boolean }) {
  const umkmName = displayName(product.umkm);
  const shopHref = product.umkm ? `/mitra/${product.umkm.id}` : "/mitra";

  return (
    <article className="card-lime flex flex-col gap-3 rounded-4xl border border-white/70 p-4 shadow-card transition hover:-translate-y-1">
      <div className="relative">
        <ProductImage src={product.image_url} alt={product.name} />
        {showUmkm && product.umkm && (
          <Link
            href={shopHref}
            className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-sun hover:underline"
          >
            {umkmName}
          </Link>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-leaf-700/90 px-3 py-1 text-xs font-semibold text-white">
          {PRODUCT_CATEGORY_LABEL[product.category] ?? "Lainnya"}
        </span>
      </div>
      <div className="px-1">
        <h3 className="truncate text-xl font-bold sm:text-2xl">{product.name}</h3>
        {product.fruit && (
          <p className="text-xs text-leaf-800">
            <Icon name="fruit" size={13} className="text-sun" /> Dari buah {product.fruit.toLowerCase()} lokal yang terselamatkan
          </p>
        )}
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 px-1">
        <p className="text-lg font-bold">{formatRupiah(product.price)}</p>
        <Link
          href={shopHref}
          className="rounded-2xl bg-leaf-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-leaf-800"
          aria-label={`Lihat toko ${umkmName} untuk ${product.name}`}
        >
          Lihat Toko →
        </Link>
      </div>
    </article>
  );
}

export function ProductGrid({ products, showUmkm = true }: { products: ProductWithUmkm[]; showUmkm?: boolean }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} showUmkm={showUmkm} />
      ))}
    </div>
  );
}
