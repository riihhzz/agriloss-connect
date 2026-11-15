import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="bg-leaf-900 text-leaf-100">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          <Logo white />
          <p className="text-sm text-leaf-200">
            Menghubungkan petani dan UMKM untuk memanfaatkan hasil panen buah lokal dan mengurangi food loss.
          </p>
        </div>
        <div>
          <h2 className="mb-3 font-semibold text-lime">Jelajahi</h2>
          <ul className="flex flex-col gap-2 text-sm">
            <li><Link href="/katalog" className="hover:text-lime">Katalog Produk Olahan</Link></li>
            <li><Link href="/mitra" className="hover:text-lime">UMKM Mitra</Link></li>
            <li><Link href="/#tentang" className="hover:text-lime">Tentang Kami</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 font-semibold text-lime">Bergabung</h2>
          <ul className="flex flex-col gap-2 text-sm">
            <li><Link href="/daftar/petani" className="hover:text-lime">Daftar sebagai Petani</Link></li>
            <li><Link href="/daftar/umkm" className="hover:text-lime">Daftar sebagai UMKM Mitra</Link></li>
            <li><Link href="/masuk" className="hover:text-lime">Masuk</Link></li>
          </ul>
        </div>
      </div>
      <p className="border-t border-leaf-800 py-4 text-center text-xs text-leaf-300">
        © {new Date().getFullYear()} Agriloss.Connect · Bersama menjaga pangan, bersama mengurangi food loss.
      </p>
    </footer>
  );
}
