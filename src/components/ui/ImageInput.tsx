"use client";

import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/utils";

/** Area unggah gambar dengan ikon kamera dan pratinjau (gaya "Upload Kondisi Buah"). */
export function ImageInput({
  name,
  label,
  defaultUrl,
  required,
  className,
  onFileChange,
}: {
  name: string;
  label: string;
  defaultUrl?: string | null;
  required?: boolean;
  className?: string;
  /** dipanggil saat pengguna memilih file (mis. untuk analisis AI) */
  onFileChange?: (file: File | null) => void;
}) {
  const id = useId();
  const [preview, setPreview] = useState<string | null>(defaultUrl ?? null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <label
        htmlFor={id}
        className="relative flex h-44 cursor-pointer items-center justify-center overflow-hidden rounded-md bg-field shadow-field transition hover:brightness-95 focus-within:ring-2 focus-within:ring-leaf-700 sm:h-52"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- pratinjau blob lokal
          <img src={preview} alt="Pratinjau gambar" className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-neutral-600">
            <CameraIcon />
            <span className="text-xs">Klik untuk memilih foto (JPG/PNG/WEBP, maks 5 MB)</span>
          </span>
        )}
        <input
          id={id}
          name={name}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required={required && !defaultUrl}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            onFileChange?.(file ?? null);
            if (!file) return;
            const url = URL.createObjectURL(file);
            setObjectUrl(url);
            setPreview(url);
          }}
        />
      </label>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="text-slate-700">
      <path d="M9 3 7.2 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L15 3H9Zm3 5a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z" />
    </svg>
  );
}
