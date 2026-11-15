import { CountUp } from "@/components/ui/CountUp";
import { cn } from "@/lib/utils";

export type Stat = { value: string; label: string };

/** Tiga angka besar dengan garis pemisah vertikal (gaya desain beranda). */
export function StatGroup({ stats, className }: { stats: Stat[]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-3", className)}>
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={cn(
            // kolom dibalik + justify-end: angka selalu sejajar di atas walau label berbeda jumlah baris
            "flex flex-col-reverse items-center justify-end gap-1 px-2 text-center sm:gap-3",
            index > 0 && "border-l-2 border-ink/80 sm:border-l-[3px] sm:border-ink",
          )}
        >
          <dt className="text-xs leading-snug text-ink sm:text-base">{stat.label}</dt>
          <dd className="whitespace-nowrap text-3xl font-bold leading-none tracking-tight sm:text-6xl sm:leading-none">
            <CountUp value={stat.value} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
