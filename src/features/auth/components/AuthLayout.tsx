import type { ReactNode } from "react";
import { Mascot } from "@/components/ui/Mascot";

/** Tata letak halaman masuk/daftar: maskot di kiri, kartu kaca di kanan. */
export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-6 px-4 py-8 sm:px-6 md:grid-cols-2 lg:px-8">
      <div className="hidden justify-center md:flex">
        <Mascot pose="wave" width={420} priority animated />
      </div>
      <section className="card-glass mx-auto w-full max-w-lg rounded-[2.5rem] border border-white/60 px-6 py-10 shadow-card sm:px-14">
        <div className="mb-6 flex justify-center md:hidden">
          <Mascot pose="wave" width={110} priority animated />
        </div>
        <h1 className="mb-8 text-center text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
        {children}
      </section>
    </div>
  );
}
