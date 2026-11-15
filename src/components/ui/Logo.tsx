import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ href = "/", white = false, className }: { href?: string; white?: boolean; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex shrink-0 items-center", className)} aria-label="Agriloss.Connect — Beranda">
      <Image
        src={white ? "/images/logo/logo-full-white.png" : "/images/logo/logo-full.png"}
        alt="Agriloss.Connect"
        width={250}
        height={50}
        priority
        className="h-8 w-auto sm:h-9"
      />
    </Link>
  );
}
