import Image from "next/image";
import { cn } from "@/lib/utils";

/** Gambar produk/buah; jika kosong tampilkan placeholder netral (logo pihak lain tidak dipakai). */
export function ProductImage({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  return (
    <div className={cn("relative aspect-square w-full overflow-hidden rounded-xl bg-neutral-100", className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-leaf-700/70">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M12 7c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7Z" />
            <path d="M12 7c0-2 1-4 4-4-0.2 2.5-1.6 4-4 4Z" />
          </svg>
          <span className="text-xs">Belum ada foto</span>
        </div>
      )}
    </div>
  );
}
