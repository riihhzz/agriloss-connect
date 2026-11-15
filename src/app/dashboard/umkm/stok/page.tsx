import type { Metadata } from "next";
import { Container, PageTitle } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { StockTable } from "@/features/stock/components/StockTable";
import { getMyStocks } from "@/features/stock/queries";
import { requireRole } from "@/lib/auth";
import { formatKg } from "@/lib/utils";

export const metadata: Metadata = { title: "Stok Bahan Baku" };

export default async function StockPage({ searchParams }: PageProps<"/dashboard/umkm/stok">) {
  const profile = await requireRole("umkm");
  const { baru } = await searchParams;
  const stocks = await getMyStocks(profile.id);

  const totalRemaining = stocks.reduce((sum, stock) => sum + (stock.quantity_kg - stock.used_kg), 0);
  const totalUsed = stocks.reduce((sum, stock) => sum + stock.used_kg, 0);

  return (
    <Container className="pt-6 sm:pt-10">
      <PageTitle title="Stok Bahan Baku" description="Bahan baku dari petani yang transaksinya telah selesai." />

      {baru && (
        <p role="status" className="mb-6 rounded-xl bg-lime/60 px-4 py-3 text-sm font-semibold">
          Transaksi selesai! Bahan baku otomatis ditambahkan ke stok.
        </p>
      )}

      <dl className="mb-8 grid grid-cols-2 gap-4 sm:max-w-md">
        <div className="rounded-2xl bg-white/70 p-4 shadow-card">
          <dt className="text-sm">Sisa stok</dt>
          <dd className="text-2xl font-bold text-leaf-800">{formatKg(totalRemaining)}</dd>
        </div>
        <div className="rounded-2xl bg-white/70 p-4 shadow-card">
          <dt className="text-sm">Sudah diolah</dt>
          <dd className="text-2xl font-bold">{formatKg(totalUsed)}</dd>
        </div>
      </dl>

      {stocks.length > 0 ? (
        <StockTable stocks={stocks} />
      ) : (
        <EmptyState
          title="Stok masih kosong"
          description="Terima penawaran petani lalu pilih Lanjutkan. Bahan baku akan otomatis tercatat di sini."
          action={
            <LinkButton href="/dashboard/umkm/penawaran" variant="lime">
              Cari Bahan Baku
            </LinkButton>
          }
        />
      )}
    </Container>
  );
}
