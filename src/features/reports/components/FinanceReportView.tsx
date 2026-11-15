import { Container, PageTitle } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { PrintButton } from "@/features/reports/components/PrintButton";
import type { FinanceReport } from "@/features/reports/queries";
import { PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { formatDate, formatKg, formatRupiah } from "@/lib/utils";
import type { UserRole } from "@/types/database";

/** Tampilan Laporan Keuangan untuk petani (pendapatan) dan UMKM (pengeluaran). */
export function FinanceReportView({ report, role, ownerName }: { report: FinanceReport; role: UserRole; ownerName: string }) {
  const isPetani = role === "petani";
  const { totals } = report;

  const cards = isPetani
    ? [
        { label: "Total pendapatan", value: formatRupiah(totals.subtotal), strong: true },
        { label: "Buah terjual (food loss diselamatkan)", value: formatKg(totals.kg) },
        { label: "Transaksi selesai", value: String(totals.transactions) },
      ]
    : [
        { label: "Total pengeluaran", value: formatRupiah(totals.total), strong: true },
        { label: "Belanja bahan baku", value: formatRupiah(totals.subtotal) },
        { label: "Biaya layanan Agriloss", value: formatRupiah(totals.fee) },
        { label: "Bahan baku dibeli", value: formatKg(totals.kg) },
      ];

  return (
    <Container className="pt-6 sm:pt-10 print:pt-0">
      <PageTitle
        title="Laporan Keuangan"
        description={`${ownerName} · ${isPetani ? "Pendapatan dari penjualan hasil panen" : "Pengeluaran pembelian bahan baku"} di Agriloss.Connect`}
        action={totals.transactions > 0 ? <PrintButton /> : undefined}
      />

      {totals.transactions === 0 ? (
        <EmptyState
          title="Belum ada transaksi lunas"
          description={
            isPetani
              ? "Pendapatan akan tercatat otomatis ketika UMKM menyelesaikan pembayaran penawaranmu."
              : "Pengeluaran tercatat otomatis ketika kamu memilih “Bayar & Lanjutkan” pada penawaran yang diterima."
          }
        />
      ) : (
        <>
          <dl className={`grid gap-4 ${isPetani ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
            {cards.map((card) => (
              <div key={card.label} className={card.strong ? "rounded-2xl bg-leaf-700 p-5 text-white shadow-card" : "rounded-2xl bg-white/80 p-5 shadow-card"}>
                <dt className="text-sm opacity-90">{card.label}</dt>
                <dd className="mt-1 text-2xl font-bold">{card.value}</dd>
              </div>
            ))}
          </dl>

          <section className="mt-10" aria-labelledby="bulanan">
            <h2 id="bulanan" className="mb-4 text-2xl font-bold">
              Ringkasan per Bulan
            </h2>
            <div className="overflow-x-auto rounded-2xl bg-white/80 shadow-card">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-leaf-700 text-white">
                  <tr>
                    <th className="px-4 py-3">Bulan</th>
                    <th className="px-4 py-3">Transaksi</th>
                    <th className="px-4 py-3">Jumlah</th>
                    <th className="px-4 py-3">{isPetani ? "Pendapatan" : "Bahan baku"}</th>
                    {!isPetani && <th className="px-4 py-3">Biaya layanan</th>}
                    {!isPetani && <th className="px-4 py-3">Total</th>}
                  </tr>
                </thead>
                <tbody>
                  {report.months.map((row) => (
                    <tr key={row.month} className="border-b border-leaf-200 last:border-b-0">
                      <td className="px-4 py-3 font-semibold">{row.month}</td>
                      <td className="px-4 py-3">{row.transactions}</td>
                      <td className="px-4 py-3">{formatKg(row.kg)}</td>
                      <td className="px-4 py-3">{formatRupiah(row.subtotal)}</td>
                      {!isPetani && <td className="px-4 py-3">{formatRupiah(row.fee)}</td>}
                      {!isPetani && <td className="px-4 py-3 font-bold">{formatRupiah(row.total)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-10" aria-labelledby="transaksi">
            <h2 id="transaksi" className="mb-4 text-2xl font-bold">
              Rincian Transaksi
            </h2>
            <div className="overflow-x-auto rounded-2xl bg-white/80 shadow-card">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-leaf-900 text-white">
                  <tr>
                    <th className="px-4 py-3">Tanggal bayar</th>
                    <th className="px-4 py-3">Komoditas</th>
                    <th className="px-4 py-3">{isPetani ? "Pembeli (UMKM)" : "Petani"}</th>
                    <th className="px-4 py-3">Jumlah × Harga</th>
                    <th className="px-4 py-3">Metode</th>
                    <th className="px-4 py-3 text-right">{isPetani ? "Diterima" : "Dibayar"}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-leaf-200 last:border-b-0 even:bg-leaf-50/60">
                      <td className="px-4 py-3">{formatDate(tx.paid_at)}</td>
                      <td className="px-4 py-3 font-semibold">{tx.fruit_type}</td>
                      <td className="px-4 py-3">{tx.partner}</td>
                      <td className="px-4 py-3">
                        {formatKg(tx.quantity_kg)} × {formatRupiah(tx.price_per_kg)}
                      </td>
                      <td className="px-4 py-3">{tx.payment_method ? PAYMENT_METHOD_LABEL[tx.payment_method] : "-"}</td>
                      <td className="px-4 py-3 text-right font-bold">
                        {formatRupiah(isPetani ? tx.subtotal : tx.total_paid)}
                        {!isPetani && <span className="block text-xs font-normal text-neutral-600">termasuk layanan {formatRupiah(tx.service_fee)}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-neutral-600">
              {isPetani
                ? "Petani menerima harga penuh. Biaya layanan Agriloss (2%, maks Rp5.000) dibayar oleh UMKM."
                : "Biaya layanan Agriloss: 2% dari nilai belanja, maksimal Rp5.000 per transaksi."}
            </p>
          </section>
        </>
      )}
    </Container>
  );
}
