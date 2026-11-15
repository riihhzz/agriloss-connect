"use client";

import Link from "next/link";
import { login } from "@/features/auth/actions";
import { usePreservedFormAction } from "@/lib/hooks/usePreservedFormAction";
import { Field, Input } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function LoginForm({ next, defaultEmail }: { next?: string; defaultEmail?: string }) {
  const { state, onSubmit, pending } = usePreservedFormAction(login);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next ?? "/dashboard"} />
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="nama@gmail.com" defaultValue={defaultEmail} required />
      </Field>
      <Field label="Password" htmlFor="password">
        <PasswordInput id="password" name="password" autoComplete="current-password" placeholder="••••••••" required />
      </Field>

      <FormMessage state={state} />

      <p className="text-center text-sm">
        Belum punya akun?{" "}
        <Link href="/pilih-peran" className="font-bold text-leaf-800 hover:underline">
          Daftar
        </Link>
      </p>

      <SubmitButton pending={pending} variant="lime" size="lg" className="mx-auto w-full max-w-60 rounded-2xl" pendingText="Masuk...">
        Masuk
      </SubmitButton>
    </form>
  );
}
