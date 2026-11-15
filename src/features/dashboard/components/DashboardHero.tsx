import { Mascot } from "@/components/ui/Mascot";
import { StatGroup, type Stat } from "@/components/ui/StatGroup";

/** Sapaan "Hallo, ..." + maskot + tiga statistik (beranda dashboard petani & UMKM). */
export function DashboardHero({ greeting, description, stats }: { greeting: string; description: string; stats: Stat[] }) {
  return (
    <section>
      <div className="grid items-center gap-4 md:grid-cols-[1.4fr_1fr]">
        <div className="order-2 md:order-1">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">{greeting}</h1>
          <p className="mt-3 max-w-lg text-base sm:text-lg">{description}</p>
        </div>
        <div className="order-1 flex justify-center md:order-2 md:justify-end">
          <Mascot pose="wave" width={300} priority animated className="w-36 sm:w-52 md:w-72" />
        </div>
      </div>
      <StatGroup className="mt-8 sm:mt-12" stats={stats} />
    </section>
  );
}
