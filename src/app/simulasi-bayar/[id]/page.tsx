import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { SimulatorPay } from "@/features/payments/components/SimulatorPay";
import { getSimulatorPayment } from "@/features/payments/queries";
import { isPaymentExpired } from "@/features/payments/status";
import { BANK_LABEL } from "@/lib/constants";
import { formatDate, formatRupiah } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Simulator Pembayaran",
  robots: { index: false },
};

/**
 * Simulator payment gateway: halaman yang terbuka saat QRIS dipindai atau
 * tombol "Buka Simulator" ditekan. Bisa dibuka tanpa login (dari HP lain).
 */
export default async function PaymentSimulatorPage({ params }: PageProps<"/simulasi-bayar/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const payment = await getSimulatorPayment(id);
  if (!payment) notFound();

  const expired = isPaymentExpired(payment);
  const payable = payment.status === "menunggu" && !expired;
  const channel = payment.method === "qris" ? "QRIS" : `Virtual Account ${payment.bank ? BANK_LABEL[payment.bank] : ""}`;

  return (
    <main className="flex min-h-screen flex-col items-center bg-leaf-900 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between text-white">
          <p className="flex items-center gap-2 text-sm font-bold">
            <Icon name="phone" /> Simulator Pembayaran
          </p>
          <span className="rounded-full bg-sun px-3 py-1 text-xs font-bold text-ink">Mode Uji</span>
        </div>

        <section className="flex flex-col gap-5 rounded-4xl bg-white p-6 shadow-2xl">
          <div className="flex flex-col items-center gap-2 border-b border-neutral-100 pb-5 text-center">
            <Logo href="/" />
            <p className="text-sm text-neutral-600">{payment.description}</p>
            <p className="text-4xl font-bold">{formatRupiah(payment.amount)}</p>
          </div>

          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-600">Penerima</dt>
              <dd className="font-semibold">{payment.merchant}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-600">Metode</dt>
              <dd className="font-semibold">{channel}</dd>
            </div>
            {payment.va_number && (
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-600">Nomor VA</dt>
                <dd className="font-mono font-semibold">{payment.va_number}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-600">Batas bayar</dt>
              <dd className="font-semibold">{formatDate(payment.expires_at, true)}</dd>
            </div>
          </dl>

          {payment.status === "berhasil" ? (
            <div className="flex flex-col items-center gap-3 text-center" role="status">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-leaf-700 text-white">
                <Icon name="check" size={34} className="stroke-3" />
              </span>
              <p className="text-xl font-bold">Pembayaran berhasil</p>
              <p className="text-sm text-neutral-600">Kembali ke halaman Agriloss.Connect. Statusnya sudah berubah otomatis menjadi lunas.</p>
            </div>
          ) : !payable ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700">
              {expired ? "Tagihan sudah kedaluwarsa." : "Tagihan sudah dibatalkan."}
            </p>
          ) : (
            <SimulatorPay id={payment.id} amount={payment.amount} payable={payable} />
          )}
        </section>

        <p className="mt-4 text-center text-xs text-leaf-100">
          Halaman ini meniru aplikasi bank / e-wallet untuk keperluan demo. Tidak ada uang sungguhan yang berpindah.
        </p>
      </div>
    </main>
  );
}
