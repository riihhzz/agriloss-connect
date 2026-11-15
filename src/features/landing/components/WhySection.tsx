import { Container } from "@/components/ui/Container";
import { Highlight, SectionHeading } from "@/components/ui/SectionHeading";
import { OfferCriteria } from "@/features/offers/components/OfferCriteria";
import { cn } from "@/lib/utils";

/** Perjalanan harga mangga dalam satu musim — contoh dari bimbingan Pak Agus. */
const PRICE_JOURNEY = [
  { phase: "Awal musim", price: "Rp30.000/kg", note: "Buah segar dijual normal di pasar.", tone: "bg-white/80" },
  { phase: "Akhir musim", price: "Rp20.000/kg", note: "Stok menumpuk, harga mulai turun.", tone: "bg-white/80" },
  {
    phase: "Agriloss.Connect",
    price: "±Rp7.000/kg",
    note: "Sisa panen masih layak ≥3 hari, dibeli UMKM untuk jus, es krim, selai.",
    tone: "bg-leaf-700 text-white ring-4 ring-lime",
    highlight: true,
  },
  { phase: "Tanpa Agriloss", price: "Rp5.000–10.000", note: "Dibanting di pinggir jalan dalam kondisi hampir busuk… lalu dibuang.", tone: "bg-red-50" },
];

const STEPS = [
  { title: "Petani menawarkan", body: "Unggah foto, harga di bawah pasar, dan perkiraan masa layak buah sisa musim." },
  { title: "UMKM menerima & membayar", body: "Diskusi lewat chat, bayar dengan QRIS / transfer / tunai, stok tercatat otomatis." },
  { title: "Diolah jadi produk", body: "Buah yang hampir terbuang menjadi produk bernilai jual di katalog UMKM." },
];

/** Seksi "Kenapa Agriloss?" — menjelaskan pasar khusus & kriteria buah (masukan Pak Agus). */
export function WhySection() {
  return (
    <Container className="mt-16 scroll-mt-24 sm:mt-24">
      <section id="kenapa" aria-labelledby="kenapa-title">
        <SectionHeading
          title={
            <span id="kenapa-title">
              Kenapa <Highlight>Agriloss.Connect</Highlight>?
            </span>
          }
          description="Bukan marketplace buah biasa: kami fokus pada hasil panen yang hampir tidak terserap pasar, sebelum terlanjur busuk dan dibuang."
        />

        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Contoh perjalanan harga mangga dalam satu musim">
          {PRICE_JOURNEY.map((item, index) => (
            <li key={item.phase} className={cn("relative flex flex-col gap-2 rounded-3xl p-5 shadow-card", item.tone)}>
              <span className={cn("text-xs font-bold uppercase tracking-wide", item.highlight ? "text-lime" : "text-neutral-500")}>
                {index + 1}. {item.phase}
              </span>
              <span className="text-2xl font-bold">{item.price}</span>
              <span className={cn("text-sm", item.highlight ? "text-leaf-50" : "text-neutral-700")}>{item.note}</span>
              {item.highlight && (
                <span className="absolute -top-3 right-4 rounded-full bg-sun px-3 py-1 text-xs font-bold text-white">Di sini kami bekerja</span>
              )}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-center text-xs text-neutral-600">Contoh harga mangga dalam satu musim panen (ilustrasi).</p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <OfferCriteria />
          <ol className="flex flex-col gap-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4 rounded-3xl bg-white/70 p-5 shadow-card">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime text-lg font-bold">{index + 1}</span>
                <div>
                  <h3 className="font-bold">{step.title}</h3>
                  <p className="text-sm text-neutral-700">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </Container>
  );
}
