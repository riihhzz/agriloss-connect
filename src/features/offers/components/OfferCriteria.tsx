import { OFFER_CRITERIA } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

/** Kotak ketentuan "Buah seperti apa yang dijual di Agriloss?" (masukan Pak Agus). */
export function OfferCriteria({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <section
      aria-labelledby="criteria-title"
      className={cn("grid gap-4 rounded-3xl border border-leaf-300 bg-white/70 p-5 sm:grid-cols-2 sm:p-6", className)}
    >
      <div className={compact ? "sm:col-span-2" : "sm:col-span-2"}>
        <h3 id="criteria-title" className="text-lg font-bold">
          Buah seperti apa yang dijual di Agriloss.Connect?
        </h3>
        {!compact && (
          <p className="mt-1 text-sm text-neutral-700">
            Platform ini khusus untuk hasil panen yang <b>hampir tidak terserap pasar</b> agar tidak terbuang — bukan untuk buah premium
            yang baru dipanen.
          </p>
        )}
      </div>
      <ul className="flex flex-col gap-2 text-sm">
        {OFFER_CRITERIA.allowed.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-leaf-700 text-white" aria-hidden="true">
              <Icon name="check" size={12} className="stroke-3" />
            </span>
            {item}
          </li>
        ))}
      </ul>
      <ul className="flex flex-col gap-2 text-sm">
        {OFFER_CRITERIA.notAllowed.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-600 text-white" aria-hidden="true">
              <Icon name="x" size={12} className="stroke-3" />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
