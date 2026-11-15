import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Mascot } from "@/components/ui/Mascot";
import { StatGroup } from "@/components/ui/StatGroup";
import type { PublicStats } from "@/features/stats/queries";
import { formatNumber } from "@/lib/utils";

export function Hero({ stats }: { stats: PublicStats }) {
  return (
    <Container className="pt-6 sm:pt-10">
      <div className="grid items-center gap-6 md:grid-cols-[1.6fr_1fr]">
        <div className="order-2 flex flex-col gap-5 md:order-1">
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-[3.6rem]">
            Petani Berdaya,
            <br />
            UMKM Berkembang,
            <br />
            <span className="text-leaf-600">Pangan Lebih Bermakna.</span>
          </h1>
          <p className="max-w-lg text-base text-neutral-800 sm:text-lg">
            Pasar khusus hasil panen sisa musim &amp; tidak lolos sortir. Petani menjual di bawah harga pasar sebelum buah terbuang, UMKM mendapat bahan baku murah untuk diolah.
          </p>
          <div className="flex flex-wrap gap-3">
            <LinkButton href="/daftar/petani" className="rounded-xl">
              Gabung sebagai petani
            </LinkButton>
            <LinkButton href="/daftar/umkm" className="rounded-xl">
              Gabung sebagai mitra
            </LinkButton>
          </div>
        </div>
        <div className="order-1 flex justify-center md:order-2 md:justify-end">
          <Mascot pose="wave" width={380} priority animated className="w-44 sm:w-64 md:w-80 lg:w-[380px]" />
        </div>
      </div>

      <StatGroup
        className="mt-10 sm:mt-14"
        stats={[
          { value: formatNumber(stats.petaniCount), label: "Jumlah Petani Terdaftar" },
          { value: formatNumber(stats.umkmCount), label: "Jumlah UMKM Mitra" },
          { value: `${formatNumber(stats.savedKg)} Kg`, label: "Food Loss Diselamatkan" },
        ]}
      />
    </Container>
  );
}
