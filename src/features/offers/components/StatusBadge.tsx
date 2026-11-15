import { STATUS_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { OfferStatus } from "@/types/database";

const STYLES: Record<OfferStatus, string> = {
  menawarkan: "bg-sun/15 text-[#b8650a]",
  diterima: "bg-blue-100 text-blue-800",
  selesai: "bg-leaf-700 text-white",
  dibatalkan: "bg-neutral-200 text-neutral-700",
};

export function StatusBadge({ status, className }: { status: OfferStatus; className?: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", STYLES[status], className)}>
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Garis progres 3 langkah: Menawarkan → Diterima → Selesai ("Live Progres"). */
export function StatusProgress({ status }: { status: OfferStatus }) {
  if (status === "dibatalkan") return null;
  const steps: OfferStatus[] = ["menawarkan", "diterima", "selesai"];
  const current = steps.indexOf(status);

  return (
    <ol className="flex items-center gap-2" aria-label={`Progres: ${STATUS_LABEL[status]}`}>
      {steps.map((step, index) => (
        <li key={step} className="flex items-center gap-2">
          <span
            className={cn("h-2.5 w-2.5 rounded-full", index <= current ? "bg-leaf-700" : "bg-leaf-300")}
            aria-current={index === current ? "step" : undefined}
          />
          <span className={cn("hidden text-xs sm:inline", index <= current ? "font-semibold" : "text-neutral-600")}>
            {STATUS_LABEL[step]}
          </span>
          {index < steps.length - 1 && <span className={cn("h-0.5 w-6", index < current ? "bg-leaf-700" : "bg-leaf-300")} />}
        </li>
      ))}
    </ol>
  );
}
