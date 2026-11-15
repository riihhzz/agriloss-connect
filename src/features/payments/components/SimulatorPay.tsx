"use client";

import { useActionState } from "react";
import { Icon } from "@/components/ui/Icon";
import { simulatePayment } from "@/features/payments/actions";
import { formatRupiah } from "@/lib/utils";

/** Tombol "Bayar" di simulator; setelah berhasil menampilkan tanda centang. */
export function SimulatorPay({ id, amount, payable }: { id: string; amount: number; payable: boolean }) {
  const [state, action, pending] = useActionState(simulatePayment, null);

  if (state?.ok) {
    return (
      <div className="flex flex-col items-center gap-3 text-center" role="status">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-leaf-700 text-white">
          <Icon name="check" size={34} className="stroke-3" />
        </span>
        <p className="text-xl font-bold">Pembayaran berhasil</p>
        <p className="text-sm text-neutral-600">
          Kembali ke halaman Agriloss.Connect. Statusnya sudah berubah otomatis menjadi lunas.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      {state && !state.ok && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={!payable || pending}
        className="h-14 w-full rounded-2xl bg-leaf-700 text-lg font-bold text-white transition hover:bg-leaf-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Memproses…" : `Bayar ${formatRupiah(amount)}`}
      </button>
    </form>
  );
}
