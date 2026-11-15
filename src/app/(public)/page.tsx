import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { Highlight, SectionHeading } from "@/components/ui/SectionHeading";
import { FactsCarousel } from "@/features/landing/components/FactsCarousel";
import { Hero } from "@/features/landing/components/Hero";
import { WhySection } from "@/features/landing/components/WhySection";
import { JoinPartnerCard, PartnerCard } from "@/features/landing/components/PartnerCard";
import { ProductGrid } from "@/features/products/components/ProductCard";
import { getPublicProducts, getUmkmPartners } from "@/features/products/queries";
import { getPublicStats } from "@/features/stats/queries";

export default async function HomePage() {
  const [stats, partners, products] = await Promise.all([
    getPublicStats(),
    getUmkmPartners(5),
    getPublicProducts({ limit: 6 }),
  ]);

  return (
    <>
      <Hero stats={stats} />

      <WhySection />

      <Container className="mt-16 sm:mt-24">
        <FactsCarousel />
      </Container>

      <Container className="mt-16 sm:mt-24">
        <section aria-labelledby="mitra-title">
          <SectionHeading
            title={
              <span id="mitra-title">
                Siapa Saja <Highlight>Mitra</Highlight> Kami?
              </span>
            }
            description="Berkenalan dengan UMKM lokal yang berkolaborasi bersama Agriloss.Connect dalam mengoptimalkan potensi food loss."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <JoinPartnerCard />
            {partners.slice(0, 5).map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
          {partners.length > 0 && (
            <div className="mt-6 flex justify-center">
              <LinkButton href="/mitra" variant="outline" className="bg-white/50">
                Lihat semua mitra
              </LinkButton>
            </div>
          )}
        </section>
      </Container>

      <Container className="mt-16 sm:mt-24">
        <section aria-labelledby="katalog-title">
          <SectionHeading
            title={
              <span id="katalog-title">
                Katalog <Highlight>Produk</Highlight> Olahan
              </span>
            }
            description="Temukan berbagai produk olahan dari UMKM mitra Agriloss.Connect."
          />
          {products.length > 0 ? (
            <>
              <ProductGrid products={products} />
              <div className="mt-8 flex justify-center">
                <LinkButton href="/katalog" variant="lime" size="lg">
                  Lihat semua produk
                </LinkButton>
              </div>
            </>
          ) : (
            <EmptyState title="Katalog masih kosong" description="Produk olahan dari UMKM mitra akan tampil di sini." />
          )}
        </section>
      </Container>
    </>
  );
}
