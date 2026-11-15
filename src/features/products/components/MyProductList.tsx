import Link from "next/link";
import { deleteProduct, toggleProductAvailability } from "@/features/products/actions";
import { ProductImage } from "@/components/ui/ProductImage";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { buttonClass } from "@/components/ui/Button";
import { formatRupiah, cn } from "@/lib/utils";
import type { Product } from "@/types/database";

/** Daftar produk milik UMKM dengan aksi ubah, tampilkan/sembunyikan, hapus. */
export function MyProductList({ products }: { products: Product[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <article key={product.id} className="card-lime flex flex-col gap-3 rounded-4xl border border-white/70 p-4 shadow-card">
          <div className="relative">
            <ProductImage src={product.image_url} alt={product.name} />
            <span
              className={cn(
                "absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold",
                product.is_available ? "bg-leaf-700 text-white" : "bg-neutral-700 text-white",
              )}
            >
              {product.is_available ? "Tersedia" : "Disembunyikan"}
            </span>
          </div>
          <div className="px-1">
            <h3 className="truncate text-xl font-bold">{product.name}</h3>
            <p className="text-sm">{formatRupiah(product.price)}</p>
          </div>
          <div className="mt-auto flex flex-wrap gap-2">
            <Link href={`/dashboard/umkm/katalog/${product.id}`} className={buttonClass("primary", "sm")}>
              Ubah
            </Link>
            <form action={toggleProductAvailability}>
              <input type="hidden" name="id" value={product.id} />
              <input type="hidden" name="next" value={String(!product.is_available)} />
              <button type="submit" className={buttonClass("outline", "sm", "bg-white/60")}>
                {product.is_available ? "Sembunyikan" : "Tampilkan"}
              </button>
            </form>
            <form action={deleteProduct}>
              <input type="hidden" name="id" value={product.id} />
              <ConfirmSubmit
                title="Hapus produk?"
                message={`"${product.name}" akan dihapus permanen dari katalog dan tidak bisa dikembalikan.`}
                confirmLabel="Ya, hapus"
                className={buttonClass("ghost", "sm", "text-red-700")}
              >
                Hapus
              </ConfirmSubmit>
            </form>
          </div>
        </article>
      ))}
    </div>
  );
}
