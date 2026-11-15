import Image from "next/image";
import { cn, initials } from "@/lib/utils";

export function Avatar({ name, url, size = 96, className }: { name: string; url: string | null; size?: number; className?: string }) {
  return (
    <div
      className={cn("relative shrink-0 overflow-hidden rounded-full bg-neutral-300", className)}
      style={{ width: size, height: size }}
    >
      {url ? (
        <Image src={url} alt={`Foto ${name}`} fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center font-bold text-leaf-800"
          style={{ fontSize: size / 2.8 }}
          aria-label={name}
        >
          {initials(name)}
        </span>
      )}
    </div>
  );
}
