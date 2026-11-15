"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { updateLocation } from "@/features/profile/actions";
import { buttonClass } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { usePreservedFormAction } from "@/lib/hooks/usePreservedFormAction";
import { Icon } from "@/components/ui/Icon";

const LeafletPicker = dynamic(() => import("@/features/profile/components/LeafletPicker"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-leaf-200" />,
});

type Point = { lat: number; lng: number };

/** Pusat default: Kota Bandung (dipakai bila lokasi belum pernah diatur). */
const DEFAULT_POINT: Point = { lat: -6.9175, lng: 107.6191 };

/** Ambil nama daerah dari koordinat (OpenStreetMap Nominatim, gratis). */
async function reverseGeocode(point: Point): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&accept-language=id&lat=${point.lat}&lon=${point.lng}`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    const data = (await response.json()) as { address?: Record<string, string> };
    const a = data.address ?? {};
    const area = a.village ?? a.suburb ?? a.town ?? a.city_district ?? a.county ?? "";
    const city = a.city ?? a.regency ?? a.county ?? a.state ?? "";
    return [area, city].filter(Boolean).filter((value, index, list) => list.indexOf(value) === index).join(", ") || null;
  } catch {
    return null;
  }
}

/**
 * Atur lokasi usaha/kebun: tombol GPS, geser pin, atau klik peta.
 * Nama daerah terisi otomatis dan bisa diedit sebelum disimpan.
 */
export function LocationPicker({
  latitude,
  longitude,
  location,
}: {
  latitude: number | null;
  longitude: number | null;
  location: string | null;
}) {
  const { state, onSubmit, pending } = usePreservedFormAction(updateLocation);
  const [point, setPoint] = useState<Point>(latitude !== null && longitude !== null ? { lat: latitude, lng: longitude } : DEFAULT_POINT);
  const [label, setLabel] = useState(location ?? "");
  const [status, setStatus] = useState<string | null>(latitude === null ? "Lokasi belum diatur — gunakan GPS atau geser pin." : null);
  const [locating, setLocating] = useState(false);

  const moveTo = async (next: Point) => {
    setPoint(next);
    setStatus("Mencari nama daerah…");
    const name = await reverseGeocode(next);
    if (name) setLabel(name);
    setStatus(name ? `Titik dipindah ke ${name}. Jangan lupa simpan.` : "Titik dipindah. Isi nama daerah lalu simpan.");
  };

  const useGps = () => {
    if (!("geolocation" in navigator)) {
      setStatus("Browser ini tidak mendukung GPS.");
      return;
    }
    setLocating(true);
    setStatus("Meminta izin lokasi…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        void moveTo({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (error) => {
        setLocating(false);
        setStatus(
          error.code === error.PERMISSION_DENIED
            ? "Izin lokasi ditolak. Izinkan lokasi di pengaturan browser, atau geser pin secara manual."
            : "Lokasi tidak dapat ditemukan. Coba lagi atau geser pin secara manual.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="latitude" value={point.lat} />
      <input type="hidden" name="longitude" value={point.lng} />

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={useGps} disabled={locating} className={buttonClass("primary", "sm")}>
          <Icon name="locate" size={16} />
          {locating ? "Mencari lokasi…" : "Gunakan lokasi saya"}
        </button>
        <span className="text-xs text-neutral-700">atau geser pin / klik peta</span>
      </div>

      <div className="relative h-64 w-full overflow-hidden rounded-xl shadow-card sm:h-80">
        <LeafletPicker point={point} onMove={moveTo} />
      </div>

      {status && (
        <p className="text-xs text-neutral-700" aria-live="polite">
          {status}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="location-label" className="sr-only">
          Nama daerah
        </label>
        <input
          id="location-label"
          name="location"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Nama daerah, mis. Ciwidey, Bandung"
          required
          minLength={3}
          className="h-11 flex-1 rounded-md bg-field px-4 text-sm shadow-field outline-none focus:ring-2 focus:ring-leaf-700"
        />
        <SubmitButton pending={pending} size="md" pendingText="Menyimpan…">
          Simpan Lokasi
        </SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
