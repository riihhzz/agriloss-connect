"use client";

import dynamic from "next/dynamic";
import { Icon } from "@/components/ui/Icon";

// Leaflet butuh `window`, jadi hanya dirender di browser.
const LeafletMap = dynamic(() => import("@/features/profile/components/LeafletMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-leaf-200" />,
});

/** Peta lokasi (OpenStreetMap). Menampilkan pesan bila koordinat belum ada. */
export function LocationMap({ latitude, longitude, label }: { latitude: number | null; longitude: number | null; label: string }) {
  return (
    <div className="relative h-64 w-full overflow-hidden rounded-xl shadow-card sm:h-80">
      {latitude !== null && longitude !== null ? (
        <LeafletMap latitude={latitude} longitude={longitude} label={label} />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 bg-leaf-200/70 px-6 text-center text-sm text-leaf-900">
          <Icon name="pin" size={36} className="text-leaf-700" />
          Lokasi belum tampil di peta. Perbarui kolom Lokasi di &quot;Ubah Data Profil&quot;.
        </div>
      )}
    </div>
  );
}
