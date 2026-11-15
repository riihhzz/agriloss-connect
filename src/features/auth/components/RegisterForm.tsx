"use client";

import Link from "next/link";
import { register } from "@/features/auth/actions";
import { usePreservedFormAction } from "@/lib/hooks/usePreservedFormAction";
import { Field, Input } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { UserRole } from "@/types/database";

export function RegisterForm({ role }: { role: UserRole }) {
  const { state, onSubmit, pending } = usePreservedFormAction(register);
  const isUmkm = role === "umkm";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="role" value={role} />

      <Field label={isUmkm ? "Nama Pemilik" : "Nama Lengkap"} htmlFor="full_name">
        <Input id="full_name" name="full_name" autoComplete="name" required minLength={3} />
      </Field>
      {isUmkm && (
        <Field label="Nama Usaha" htmlFor="business_name">
          <Input id="business_name" name="business_name" autoComplete="organization" required />
        </Field>
      )}
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="nama@gmail.com" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="No HP" htmlFor="whatsapp">
          <Input id="whatsapp" name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" placeholder="0812xxxxxxx" required />
        </Field>
        <Field label="Lokasi" htmlFor="location">
          <Input id="location" name="location" placeholder={isUmkm ? "Jatinangor, Sumedang" : "Ciwidey, Bandung"} required />
        </Field>
      </div>
      <Field label="Password" htmlFor="password" hint="Minimal 8 karakter">
        <PasswordInput id="password" name="password" autoComplete="new-password" required minLength={8} />
      </Field>
      <Field label="Konfirmasi Password" htmlFor="confirm_password">
        <PasswordInput id="confirm_password" name="confirm_password" autoComplete="new-password" required minLength={8} />
      </Field>

      <FormMessage state={state} />

      <SubmitButton pending={pending} variant="lime" size="lg" className="mx-auto mt-2 w-full max-w-60 rounded-2xl" pendingText="Mendaftar...">
        Daftar
      </SubmitButton>

      <p className="text-center text-sm">
        Sudah punya akun?{" "}
        <Link href="/masuk" className="font-bold text-leaf-800 hover:underline">
          Masuk
        </Link>
      </p>
    </form>
  );
}
