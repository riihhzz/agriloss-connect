import type { Metadata } from "next";
import { Mascot } from "@/components/ui/Mascot";
import { RoleCard } from "@/features/auth/components/RoleCard";

export const metadata: Metadata = { title: "Pilih Peran" };

export default function ChooseRolePage() {
  return (
    <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 px-4 py-8 sm:px-6 md:grid-cols-2 lg:px-8">
      <div className="flex flex-col items-center gap-4 text-center md:items-start md:text-left">
        <Mascot pose="wave" width={380} priority animated className="w-40 sm:w-56 md:w-80" />
        <h1 className="text-3xl font-bold sm:text-4xl">Bergabung bersama kami</h1>
        <p className="max-w-md text-neutral-800">Pilih peranmu untuk mulai mengurangi food loss bersama Agriloss.Connect.</p>
      </div>
      <div className="flex flex-col gap-6">
        <RoleCard
          href="/daftar/petani"
          role="petani"
          title="Bergabung sebagai Petani"
          description="Tawarkan hasil panen yang tidak lolos sortir pasar agar diolah UMKM."
        />
        <RoleCard
          href="/daftar/umkm"
          role="umkm"
          title="Bergabung sebagai Mitra"
          description="Dapatkan bahan baku buah lokal dan pamerkan produk olahan usahamu."
        />
      </div>
    </div>
  );
}
