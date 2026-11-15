"use client";

import { useActionState, useEffect, useRef } from "react";
import { recordUsage } from "@/features/stock/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { cn } from "@/lib/utils";

/** Form ringkas "Input Penggunaan" untuk satu baris stok. */
export function UsageForm({ stockId, remaining, fruit }: { stockId: string; remaining: number; fruit: string }) {
  const [state, action] = useActionState(recordUsage, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  if (remaining <= 0) return <span className="text-xs text-neutral-600">Habis</span>;

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-1">
      <input type="hidden" name="stock_id" value={stockId} />
      <div className="flex items-center gap-2">
        <label htmlFor={`amount-${stockId}`} className="sr-only">
          Jumlah {fruit} yang dipakai (Kg)
        </label>
        <input
          id={`amount-${stockId}`}
          name="amount_kg"
          type="number"
          min={0.1}
          step={0.1}
          max={remaining}
          placeholder="Kg"
          required
          className="h-9 w-20 rounded-md bg-field px-2 text-sm shadow-field outline-none focus:ring-2 focus:ring-leaf-700"
        />
        <SubmitButton variant="lime" size="sm" pendingText="...">
          Pakai
        </SubmitButton>
      </div>
      {state?.message && (
        <span role={state.ok ? "status" : "alert"} className={cn("text-xs", state.ok ? "text-leaf-800" : "text-red-700")}>
          {state.message}
        </span>
      )}
    </form>
  );
}
