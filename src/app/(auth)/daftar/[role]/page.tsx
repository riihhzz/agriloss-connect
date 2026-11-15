import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import type { UserRole } from "@/types/database";

const TITLES: Record<UserRole, string> = {
  petani: "Daftar Petani",
  umkm: "Daftar UMKM",
};

export function generateStaticParams() {
  return [{ role: "petani" }, { role: "umkm" }];
}

export async function generateMetadata({ params }: PageProps<"/daftar/[role]">): Promise<Metadata> {
  const { role } = await params;
  return { title: TITLES[role as UserRole] ?? "Daftar" };
}

export default async function RegisterPage({ params }: PageProps<"/daftar/[role]">) {
  const { role } = await params;
  if (role !== "petani" && role !== "umkm") notFound();

  return (
    <AuthLayout title={TITLES[role]}>
      <RegisterForm role={role} />
    </AuthLayout>
  );
}
