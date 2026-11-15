import type { Metadata } from "next";
import { ProfilePage } from "@/features/profile/components/ProfilePage";
import { QrCatalogCard } from "@/features/profile/components/QrCatalogCard";
import { requireRole } from "@/lib/auth";
import { siteOrigin } from "@/lib/site";

export const metadata: Metadata = { title: "Profil UMKM" };

export default async function UmkmProfilePage() {
  const profile = await requireRole("umkm");
  const catalogUrl = `${await siteOrigin()}/mitra/${profile.id}`;

  return (
    <ProfilePage
      profile={profile}
      email={profile.email}
      aside={<QrCatalogCard catalogUrl={catalogUrl} businessName={profile.business_name ?? profile.full_name} />}
    />
  );
}
