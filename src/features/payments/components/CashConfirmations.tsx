import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { Icon } from "@/components/ui/Icon";
import { confirmCashPayment } from "@/features/payments/actions";
import type { PendingCashPayment } from "@/features/payments/queries";
import { buttonClass } from "@/components/ui/Button";
import { displayName, formatDate, formatKg, formatRupiah } from "@/lib/utils";

/** Daftar pembayaran tunai (COD) yang menunggu konfirmasi petani. */
export function CashConfirmations({ payments }: { payments: PendingCashPayment[] }) {
  if (payments.length === 0) return null;
  return (
    <section className="mb-8 flex flex-col gap-3" aria-labelledby="cash-title">
      <h2 id="cash-title" className="flex items-center gap-2 text-xl font-bold">
        <Icon name="cash" size={22} className="text-leaf-700" /> Konfirmasi uang tunai
      </h2>
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="flex flex-col gap-3 rounded-2xl border-2 border-sun bg-sun-soft px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-semibold">
              {displayName(payment.payer)} akan membayar tunai <b>{formatRupiah(payment.amount)}</b>
            </p>
            <p className="text-sm text-neutral-700">
              {payment.offer ? `${payment.offer.fruit_type} ${formatKg(payment.offer.quantity_kg)} · ` : ""}
              berlaku sampai {formatDate(payment.expires_at, true)}
            </p>
          </div>
          <form action={confirmCashPayment}>
            <input type="hidden" name="id" value={payment.id} />
            <ConfirmSubmit
              title="Uang tunai sudah diterima?"
              message={`Pastikan kamu sudah menerima ${formatRupiah(payment.amount)} dari ${displayName(payment.payer)}. Setelah dikonfirmasi, transaksi selesai dan tidak bisa dibatalkan.`}
              confirmLabel="Ya, sudah diterima"
              cancelLabel="Belum"
              tone="primary"
              className={buttonClass("primary", "md")}
            >
              Uang sudah saya terima
            </ConfirmSubmit>
          </form>
        </div>
      ))}
    </section>
  );
}
