"use client";

import { useState } from "react";
import { Field, Input, Select } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { topUp, withdraw } from "@/features/payments/actions";
import { PaymentMethodPicker } from "@/features/payments/components/PaymentMethodPicker";
import { MIN_WITHDRAWAL, TOPUP_PRESETS, WITHDRAW_TARGETS } from "@/lib/constants";
import { usePreservedFormAction } from "@/lib/hooks/usePreservedFormAction";
import { cn, formatRupiah } from "@/lib/utils";

/** Isi Saldo Agriloss (UMKM): pilih nominal lalu bayar lewat QRIS / Virtual Account. */
export function TopUpForm() {
  const { state, onSubmit, pending } = usePreservedFormAction(topUp);
  const [amount, setAmount] = useState("100000");

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Field label="Nominal isi saldo" htmlFor="topup-amount" hint="Minimal Rp10.000, maksimal Rp10.000.000.">
        <Input
          id="topup-amount"
          name="amount"
          type="number"
          min={10000}
          max={10000000}
          step={1}
          inputMode="numeric"
          required
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        {TOPUP_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setAmount(String(preset))}
            className={cn(
              "rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition",
              Number(amount) === preset ? "border-leaf-700 bg-leaf-700 text-white" : "border-leaf-300 bg-white hover:bg-leaf-100",
            )}
          >
            {formatRupiah(preset)}
          </button>
        ))}
      </div>
      <PaymentMethodPicker total={Number(amount) || 0} />
      <FormMessage state={state} />
      <SubmitButton pending={pending} pendingText="Membuat tagihan..." className="self-start">
        Lanjut Bayar {Number(amount) >= 10000 ? formatRupiah(Number(amount)) : ""}
      </SubmitButton>
    </form>
  );
}

/** Tarik Saldo Agriloss ke rekening bank / e-wallet. */
export function WithdrawForm({ balance, defaultName }: { balance: number; defaultName: string }) {
  const { state, onSubmit, pending } = usePreservedFormAction(withdraw);
  const [amount, setAmount] = useState("");
  const [lastState, setLastState] = useState(state);
  const [formKey, setFormKey] = useState(0);

  // Setelah berhasil: kosongkan nominal (form di-remount)
  if (state !== lastState) {
    setLastState(state);
    if (state?.ok) {
      setAmount("");
      setFormKey((key) => key + 1);
    }
  }

  const tooLow = balance < MIN_WITHDRAWAL;

  return (
    <form key={formKey} onSubmit={onSubmit} className="flex flex-col gap-5">
      {tooLow && (
        <p className="rounded-xl bg-sun-soft px-4 py-2 text-sm text-[#8a4b05]">
          Saldo minimal {formatRupiah(MIN_WITHDRAWAL)} untuk bisa ditarik.
        </p>
      )}
      <Field label="Jumlah penarikan" htmlFor="wd-amount" hint={`Saldo tersedia ${formatRupiah(balance)}. Minimal ${formatRupiah(MIN_WITHDRAWAL)}.`}>
        <div className="flex gap-2">
          <Input
            id="wd-amount"
            name="amount"
            type="number"
            min={MIN_WITHDRAWAL}
            max={balance}
            step={1}
            inputMode="numeric"
            required
            disabled={tooLow}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="50000"
          />
          <button
            type="button"
            disabled={tooLow}
            onClick={() => setAmount(String(balance))}
            className="shrink-0 rounded-md bg-leaf-100 px-4 text-sm font-semibold text-leaf-800 hover:bg-leaf-200 disabled:opacity-50"
          >
            Tarik semua
          </button>
        </div>
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Bank / e-wallet tujuan" htmlFor="wd-bank">
          <Select id="wd-bank" name="bank" required defaultValue="" disabled={tooLow}>
            <option value="" disabled>
              Pilih tujuan
            </option>
            {WITHDRAW_TARGETS.map((target) => (
              <option key={target} value={target}>
                {target}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Nomor rekening / e-wallet" htmlFor="wd-account">
          <Input id="wd-account" name="account_number" inputMode="numeric" placeholder="1234567890" required disabled={tooLow} />
        </Field>
      </div>
      <Field label="Nama pemilik rekening" htmlFor="wd-name">
        <Input id="wd-name" name="account_name" defaultValue={defaultName} required disabled={tooLow} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton pending={pending} pendingText="Memproses penarikan..." disabled={tooLow} className="self-start">
        Tarik Saldo
      </SubmitButton>
    </form>
  );
}
