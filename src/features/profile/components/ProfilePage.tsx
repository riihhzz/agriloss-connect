import type { ReactNode } from "react";
import { Container, PageTitle } from "@/components/ui/Container";
import { EditProfileForm } from "@/features/profile/components/EditProfileForm";
import { LocationPicker } from "@/features/profile/components/LocationPicker";
import { ProfileHeader } from "@/features/profile/components/ProfileHeader";
import { ProfileInfo } from "@/features/profile/components/ProfileInfo";
import type { Profile } from "@/types/database";

/** Halaman profil bersama untuk petani & UMKM. `aside` diisi kartu QR untuk UMKM. */
export function ProfilePage({ profile, email, aside }: { profile: Profile; email: string; aside?: ReactNode }) {
  return (
    <Container className="py-8 sm:py-10">
      <PageTitle title="Profil" description="Bersama menjaga pangan, bersama mengurangi food loss" />
      <ProfileHeader profile={profile} />

      <div className={aside ? "mt-10 grid gap-10 lg:grid-cols-[1.3fr_1fr]" : "mt-10 grid gap-10 lg:grid-cols-2"}>
        <div className="flex flex-col gap-8">
          <ProfileInfo profile={profile} email={email} />
          {aside && <LocationSection profile={profile} />}
        </div>
        {aside ?? <LocationSection profile={profile} />}
      </div>

      <div className="mt-10">
        <EditProfileForm profile={profile} />
      </div>
    </Container>
  );
}

function LocationSection({ profile }: { profile: Profile }) {
  return (
    <section aria-labelledby="map-title">
      <h2 id="map-title" className="mb-3 text-lg font-bold">
        Lokasi {profile.role === "umkm" ? "Usaha" : "Kebun"}
      </h2>
      <LocationPicker latitude={profile.latitude} longitude={profile.longitude} location={profile.location} />
    </section>
  );
}
