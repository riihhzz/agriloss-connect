import type { Metadata } from "next";
import { FormMessage } from "@/components/ui/FormMessage";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = { title: "Masuk" };

const REGISTER_NOTICE: Record<string, string> = {
  berhasil: "Pendaftaran berhasil! Silakan masuk dengan email dan password yang baru kamu buat.",
  "cek-email": "Pendaftaran berhasil! Cek email kamu untuk konfirmasi akun, lalu masuk di sini.",
};

export default async function LoginPage({ searchParams }: PageProps<"/masuk">) {
  const { next, daftar, email } = await searchParams;
  const notice = typeof daftar === "string" ? REGISTER_NOTICE[daftar] : undefined;

  return (
    <AuthLayout title="Masuk">
      {notice && <FormMessage state={{ ok: true, message: notice }} className="mb-6" />}
      <LoginForm
        next={typeof next === "string" ? next : undefined}
        defaultEmail={typeof email === "string" ? email : undefined}
      />
    </AuthLayout>
  );
}
