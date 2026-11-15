"use client";

import { useActionState } from "react";
import { updateProfile } from "@/features/profile/actions";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { Profile } from "@/types/database";

/** Form ubah profil, dibungkus <details> agar tidak memenuhi halaman. */
export function EditProfileForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState(updateProfile, null);
  const isUmkm = profile.role === "umkm";

  return (
    <details className="group rounded-3xl bg-white/60 p-5 shadow-card sm:p-6" open={state !== null && !state.ok}>
      <summary className="cursor-pointer list-none text-lg font-bold marker:hidden">
        <span className="inline-flex items-center gap-2">
          Ubah Data Profil
          <svg className="transition group-open:rotate-180" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </summary>
      <form action={action} className="mt-5 flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={isUmkm ? "Nama Pemilik" : "Nama Lengkap"} htmlFor="full_name">
            <Input id="full_name" name="full_name" defaultValue={profile.full_name} required minLength={3} />
          </Field>
          {isUmkm && (
            <Field label="Nama Usaha" htmlFor="business_name">
              <Input id="business_name" name="business_name" defaultValue={profile.business_name ?? ""} required />
            </Field>
          )}
          <Field label="No HP (opsional)" htmlFor="whatsapp" hint="Tidak ditampilkan publik. Komunikasi lewat Chat Agriloss.">
            <Input id="whatsapp" name="whatsapp" type="tel" defaultValue={profile.whatsapp ?? ""} />
          </Field>
        </div>
        {isUmkm && (
          <Field label="Deskripsi Singkat Usaha" htmlFor="description">
            <Textarea id="description" name="description" defaultValue={profile.description ?? ""} placeholder="Ceritakan produk olahan usahamu..." />
          </Field>
        )}
        <FormMessage state={state} />
        <SubmitButton className="w-full sm:w-fit" pendingText="Menyimpan...">
          Simpan Perubahan
        </SubmitButton>
      </form>
    </details>
  );
}
