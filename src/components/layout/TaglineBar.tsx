import Link from "next/link";
import { VALUE_TAGLINE } from "@/lib/constants";
import { Icon } from "@/components/ui/Icon";

/** Bilah tipis di atas navbar: menjelaskan kegunaan platform di setiap halaman (masukan Pak Agus). */
export function TaglineBar() {
  return (
    <div className="bg-leaf-900 px-4 py-1.5 text-center text-xs text-leaf-100 print:hidden sm:text-[13px]">
      <Icon name="fruit" size={14} className="mr-1 text-sun" />
      {VALUE_TAGLINE}{" "}
      <Link href="/#kenapa" className="whitespace-nowrap font-semibold text-lime hover:underline">
        Pelajari →
      </Link>
    </div>
  );
}
