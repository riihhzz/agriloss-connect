import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { Highlight, SectionHeading } from "@/components/ui/SectionHeading";
import { JoinPartnerCard, PartnerCard } from "@/features/landing/components/PartnerCard";
import { getUmkmPartners } from "@/features/products/queries";

export const metadata: Metadata = {
  title: "UMKM Mitra",
  description: "UMKM lokal yang mengolah hasil panen petani bersama Agriloss.Connect.",
};

export default async function PartnersPage() {
  const partners = await getUmkmPartners();

  return (
    <Container className="pt-8 sm:pt-12">
      <SectionHeading
        title={
          <>
            Siapa Saja <Highlight>Mitra</Highlight> Kami?
          </>
        }
        description="Berkenalan dengan UMKM lokal yang berkolaborasi bersama Agriloss.Connect dalam mengoptimalkan potensi food loss."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <JoinPartnerCard />
        {partners.map((partner) => (
          <PartnerCard key={partner.id} partner={partner} />
        ))}
      </div>
      {partners.length === 0 && <EmptyState className="mt-8" title="Belum ada UMKM mitra" description="Jadilah mitra pertama!" />}
    </Container>
  );
}
