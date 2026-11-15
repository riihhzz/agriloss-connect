"use client";

import { QRCodeCanvas } from "qrcode.react";
import { useRef } from "react";
import { buttonClass } from "@/components/ui/Button";

/** Kartu "QR Katalog Produk": QR menuju halaman katalog publik UMKM + tombol unduh. */
export function QrCatalogCard({ catalogUrl, businessName }: { catalogUrl: string; businessName: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `QR-Katalog-${businessName.replace(/\W+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    // h-full + justify-center: kartu setinggi kolom kiri (info + peta) sehingga tidak ada ruang kosong
    <section className="flex h-full flex-col items-center justify-center gap-5 rounded-[2.5rem] bg-gradient-to-b from-leaf-500 to-leaf-700 p-6 text-center text-white shadow-card sm:p-8">
      <div className="w-full max-w-[320px] rounded-2xl bg-white p-4 shadow-lg">
        <QRCodeCanvas
          ref={canvasRef}
          value={catalogUrl}
          size={480}
          marginSize={2}
          fgColor="#1c3a2e"
          title={`QR katalog ${businessName}`}
          style={{ width: "100%", height: "auto" }}
        />
      </div>
      <h2 className="text-2xl font-bold sm:text-3xl">QR Katalog Produk</h2>
      <p className="max-w-xs text-sm sm:text-base">Tampilkan katalog produk usahamu melalui QR code ini di outlet atau kemasan.</p>
      <button type="button" onClick={download} className={buttonClass("lime", "lg", "w-full max-w-xs rounded-2xl font-bold")}>
        Download QR
      </button>
      <a href={catalogUrl} target="_blank" rel="noopener noreferrer" className="break-all text-xs text-leaf-50 underline">
        {catalogUrl}
      </a>
    </section>
  );
}
