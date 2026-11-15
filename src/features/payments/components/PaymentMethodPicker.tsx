"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { BANK_LABEL } from "@/lib/constants";
import { cn, formatRupiah } from "@/lib/utils";
import type { BankCode } from "@/types/database";

export type PayMethod = "qris" | "va" | "saldo" | "tunai";
type Method = PayMethod;

const OPTIONS: { value: Method; title: string; hint: string; icon: IconName }[] = [
  { value: "qris", title: "QRIS", hint: "Pindai dengan aplikasi bank / e-wallet apa pun", icon: "qr" },
  { value: "va", title: "Virtual Account", hint: "Transfer ke nomor VA bank pilihan", icon: "bank" },
  { value: "saldo", title: "Saldo Agriloss", hint: "Langsung terpotong dari saldo", icon: "wallet" },
  { value: "tunai", title: "Tunai (COD)", hint: "Bayar langsung ke petani, tanpa biaya layanan", icon: "cash" },
];

/**
 * Pilihan metode bayar (QRIS / Virtual Account / Saldo). Mengirim field
 * `payment_method` dan `bank` di dalam form induk.
 */
export function PaymentMethodPicker({
  total,
  balance,
  tone = "light",
  allowCash = false,
  initialMethod = "qris",
  onMethodChange,
}: {
  total: number;
  /** saldo pengguna; bila tidak diisi, opsi Saldo disembunyikan (mis. saat isi saldo) */
  balance?: number;
  tone?: "light" | "dark";
  /** tampilkan opsi Tunai (COD); hanya untuk transaksi, bukan isi saldo */
  allowCash?: boolean;
  /** pilihan awal; dipakai agar pilihan tetap sama saat komponen dipasang ulang */
  initialMethod?: Method;
  onMethodChange?: (method: Method) => void;
}) {
  const options = OPTIONS.filter(
    (option) => (option.value !== "saldo" || balance !== undefined) && (option.value !== "tunai" || allowCash),
  );
  const enoughBalance = balance !== undefined && balance >= total;
  const [method, setMethod] = useState<Method>(initialMethod);
  const [bank, setBank] = useState<BankCode>("bca");
  const dark = tone === "dark";

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className={cn("mb-2 text-sm font-semibold", dark ? "text-white" : "text-ink")}>Metode pembayaran</legend>
      <div className={cn("grid gap-2", options.length > 3 ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
        {options.map((option) => {
          const disabled = option.value === "saldo" && !enoughBalance;
          return (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-3 text-sm transition",
                dark ? "border-white/25 text-white" : "border-leaf-200 bg-white text-ink",
                "has-checked:border-lime has-checked:bg-lime has-checked:text-ink",
                "has-focus-visible:ring-4 has-focus-visible:ring-lime/60",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <input
                type="radio"
                name="payment_method"
                value={option.value}
                checked={method === option.value}
                disabled={disabled}
                onChange={() => {
                  setMethod(option.value);
                  onMethodChange?.(option.value);
                }}
                className="sr-only"
              />
              <Icon name={option.icon} size={22} className="mt-0.5" />
              <span className="flex flex-col">
                <span className="font-bold">{option.title}</span>
                <span className="text-xs opacity-80">
                  {option.value === "saldo" && balance !== undefined
                    ? `Saldo ${formatRupiah(balance)}${enoughBalance ? "" : " (tidak cukup)"}`
                    : option.hint}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {method === "va" && (
        <div className="flex flex-col gap-2">
          <p className={cn("text-sm font-semibold", dark ? "text-white" : "text-ink")}>Pilih bank</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(BANK_LABEL) as BankCode[]).map((code) => (
              <label
                key={code}
                className={cn(
                  "cursor-pointer rounded-full border-2 px-4 py-1.5 text-sm font-bold transition",
                  dark ? "border-white/30 text-white" : "border-leaf-300 bg-white text-ink",
                  "has-checked:border-lime has-checked:bg-lime has-checked:text-ink",
                  "has-focus-visible:ring-4 has-focus-visible:ring-lime/60",
                )}
              >
                <input type="radio" name="bank" value={code} checked={bank === code} onChange={() => setBank(code)} className="sr-only" />
                {BANK_LABEL[code]}
              </label>
            ))}
          </div>
        </div>
      )}
    </fieldset>
  );
}
