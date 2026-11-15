"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { acceptOffer, decideOffer } from "@/features/offers/actions";
import { usePreservedFormAction } from "@/lib/hooks/usePreservedFormAction";
import { formatRupiah, serviceFee } from "@/lib/utils";
import { Field, Input } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Mascot } from "@/components/ui/Mascot";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PaymentMethodPicker, type PayMethod } from "@/features/payments/components/PaymentMethodPicker";

/** Tombol "Terima" untuk penawaran yang masih terbuka. */
export function AcceptOfferForm({ offerId }: { offerId: string }) {
  const [state, action] = useActionState(acceptOffer, null);
  return (
    <form action={action} className="flex flex-col items-center gap-3">
      <input type="hidden" name="id" value={offerId} />
      <FormMessage state={state} className="w-full" />
      <SubmitButton variant="lime" size="lg" className="w-full rounded-2xl sm:w-60" pendingText="Menerima...">
        Terima Penawaran
      </SubmitButton>
    </form>
  );
}

/**
 * Setelah diterima: Bayar (QRIS / Virtual Account / Saldo; transaksi selesai
 * setelah lunas) atau Batal (penawaran kembali tersedia untuk UMKM lain).
 */
export function DecisionPanel({
  offerId,
  subtotal,
  chatHref,
  defaultFresh,
  balance,
  pendingPaymentHref,
}: {
  offerId: string;
  /** jumlah Kg × harga per Kg */
  subtotal: number;
  chatHref: string;
  /** tanggal default estimasi kesegaran (YYYY-MM-DD) */
  defaultFresh: string;
  /** Saldo Agriloss UMKM */
  balance: number;
  /** tagihan QRIS/VA yang sudah dibuat dan belum dibayar */
  pendingPaymentHref?: string | null;
}) {
  const { state, onSubmit, pending } = usePreservedFormAction(decideOffer);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [method, setMethod] = useState<PayMethod>("qris");
  // Tunai (COD) dibayar langsung ke petani tanpa biaya layanan
  const fee = method === "tunai" ? 0 : serviceFee(subtotal);

  return (
    <section className="rounded-3xl bg-leaf-900 p-6 text-white sm:p-8" aria-labelledby="decision-title">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <Mascot pose={confirmCancel ? "shock" : "point"} width={110} className="hidden sm:block" />
        <div className="flex-1">
          <h2 id="decision-title" className="text-2xl font-bold">
            {confirmCancel ? "Yakin membatalkan?" : "Lanjutkan transaksi?"}
          </h2>
          <p className="mt-2 text-sm text-leaf-100">
            {confirmCancel
              ? "Penawaran akan kembali tersedia untuk UMKM lain dan petani akan diberi tahu."
              : "Pastikan buah sudah diterima sesuai kesepakatan di chat. Setelah pembayaran lunas, transaksi selesai, bahan baku otomatis masuk ke Stok, dan uang masuk ke Saldo Agriloss petani."}
          </p>

          {pendingPaymentHref && !confirmCancel && (
            <Link
              href={pendingPaymentHref}
              className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-sun px-4 py-3 text-sm font-semibold text-ink hover:brightness-95"
            >
              <span className="flex items-center gap-2">
                <Icon name="clock" /> Ada tagihan yang belum dibayar. Lanjutkan pembayaran
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          )}

          <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-5">
            <input type="hidden" name="id" value={offerId} />
            {!confirmCancel && (
              <>
                <dl className="grid max-w-md gap-1.5 rounded-2xl bg-white/10 p-4 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt>Subtotal buah</dt>
                    <dd className="whitespace-nowrap">{formatRupiah(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>{method === "tunai" ? "Biaya layanan (tunai bebas biaya)" : "Biaya layanan (2%, maks Rp5.000)"}</dt>
                    <dd className="whitespace-nowrap">{formatRupiah(fee)}</dd>
                  </div>
                  <div className="mt-1 flex justify-between border-t border-white/20 pt-2 text-base font-bold text-lime">
                    <dt>Total dibayar</dt>
                    <dd className="whitespace-nowrap">{formatRupiah(subtotal + fee)}</dd>
                  </div>
                  <p className="mt-1 text-xs text-leaf-100">Petani menerima penuh {formatRupiah(subtotal)}.</p>
                </dl>

                <PaymentMethodPicker total={subtotal + serviceFee(subtotal)} balance={balance} tone="dark" allowCash initialMethod={method} onMethodChange={setMethod} />

                <Field label="Estimasi kesegaran hingga" htmlFor="fresh_until" className="max-w-xs [&_label]:text-white">
                  <Input id="fresh_until" name="fresh_until" type="date" defaultValue={defaultFresh} />
                </Field>
              </>
            )}

            <FormMessage state={state} />

            <div className="flex flex-wrap gap-3">
              {confirmCancel ? (
                <>
                  <SubmitButton pending={pending} name="decision" value="batal" variant="danger" pendingText="Membatalkan..." formNoValidate>
                    Ya, Batalkan
                  </SubmitButton>
                  <button type="button" className={buttonClass("ghost", "md", "text-white hover:bg-white/10")} onClick={() => setConfirmCancel(false)}>
                    Kembali
                  </button>
                </>
              ) : (
                <>
                  <SubmitButton pending={pending} name="decision" value="lanjutkan" variant="lime" pendingText="Memproses...">
                    Bayar {formatRupiah(subtotal + fee)}
                  </SubmitButton>
                  <button type="button" className={buttonClass("outline", "md", "border-white text-white hover:bg-white hover:text-leaf-900")} onClick={() => setConfirmCancel(true)}>
                    Batal
                  </button>
                  <Link href={chatHref} className={buttonClass("ghost", "md", "text-lime hover:bg-white/10")}>
                    <Icon name="chat" /> Chat Petani
                  </Link>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
