import { LinkButton } from "@/components/ui/Button";
import { Mascot } from "@/components/ui/Mascot";

export default function NotFound() {
  return (
    <main className="bg-agri flex min-h-screen flex-col items-center justify-center gap-5 px-4 text-center">
      <Mascot pose="confused" width={200} />
      <h1 className="text-4xl font-bold">Halaman tidak ditemukan</h1>
      <p className="max-w-md text-neutral-800">Sepertinya halaman yang kamu cari sudah dipindahkan atau tidak pernah ada.</p>
      <LinkButton href="/">Kembali ke Beranda</LinkButton>
    </main>
  );
}
