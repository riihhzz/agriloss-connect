import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PROFILE_PUBLIC_COLUMNS, type Profile, type UserRole } from "@/types/database";

/** Profil user yang sedang login (di-cache per request). */
export const getCurrentProfile = cache(async (): Promise<(Profile & { email: string }) | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Nomor HP tidak bisa dibaca dari tabel (kolomnya dikunci); pemilik mengambilnya lewat RPC
  const [{ data: profile }, { data: phone }] = await Promise.all([
    supabase.from("profiles").select(PROFILE_PUBLIC_COLUMNS).eq("id", user.id).single<Omit<Profile, "whatsapp">>(),
    supabase.rpc("my_phone"),
  ]);
  if (!profile) return null;

  return { ...profile, whatsapp: (phone as string | null) ?? null, email: user.email ?? "" };
});

/** Wajib login dengan peran tertentu; jika tidak, arahkan ulang. */
export async function requireRole(role: UserRole) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/masuk");
  if (profile.role !== role) redirect(`/dashboard/${profile.role}`);
  return profile;
}
