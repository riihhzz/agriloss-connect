"use client";

import { Button, LinkButton } from "@/components/ui/Button";
import { Mascot } from "@/components/ui/Mascot";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="bg-agri flex min-h-screen flex-col items-center justify-center gap-5 px-4 text-center">
      <Mascot pose="sad" width={200} />
      <h1 className="text-4xl font-bold">Terjadi kesalahan</h1>
      <p className="max-w-md text-neutral-800">Maaf, ada yang tidak berjalan semestinya. Silakan coba lagi.</p>
      <div className="flex gap-3">
        <Button onClick={reset}>Coba lagi</Button>
        <LinkButton href="/" variant="outline">
          Beranda
        </LinkButton>
      </div>
    </main>
  );
}
