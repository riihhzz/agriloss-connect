"use client";

import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

/** Cetak laporan / simpan sebagai PDF lewat dialog cetak browser. */
export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={buttonClass("outline", "md", "bg-white/60 print:hidden")}>
      <Icon name="printer" /> Cetak / Simpan PDF
    </button>
  );
}
