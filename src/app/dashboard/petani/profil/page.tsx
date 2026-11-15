import type { Metadata } from "next";
import { ProfilePage } from "@/features/profile/components/ProfilePage";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Profil Petani" };

export default async function PetaniProfilePage() {
  const profile = await requireRole("petani");
  return <ProfilePage profile={profile} email={profile.email} />;
}
