import { formatDate } from "@/lib/utils";
import type { Profile } from "@/types/database";

/** Daftar "Informasi Akun" dua kolom (label : nilai). */
export function ProfileInfo({ profile, email }: { profile: Profile; email: string }) {
  const rows: Array<[string, string]> = [
    ["Nama Pemilik", profile.full_name],
    ["Email", email],
    ["No HP", profile.whatsapp ?? "-"],
    ["Lokasi", profile.location ?? "-"],
    ["Bergabung sejak", formatDate(profile.created_at)],
  ];

  return (
    <section aria-labelledby="info-title">
      <h2 id="info-title" className="mb-3 text-lg font-bold">
        Informasi Akun
      </h2>
      <dl className="grid grid-cols-[minmax(0,9rem)_1fr] gap-x-4 gap-y-3 text-base sm:grid-cols-[13rem_1fr] sm:text-lg">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt>{label}</dt>
            <dd className="break-words">: {value}</dd>
          </div>
        ))}
      </dl>
      {profile.description && <p className="mt-4 text-sm text-neutral-800">{profile.description}</p>}
    </section>
  );
}
