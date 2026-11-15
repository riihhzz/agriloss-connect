import type { ActionState } from "@/types/database";
import { cn } from "@/lib/utils";

/** Pesan sukses/gagal dari Server Action. */
export function FormMessage({ state, className }: { state: ActionState; className?: string }) {
  if (!state?.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={cn(
        "rounded-xl px-4 py-3 text-sm font-medium",
        state.ok ? "bg-lime/60 text-leaf-900" : "bg-red-100 text-red-800",
        className,
      )}
    >
      {state.message}
    </p>
  );
}
