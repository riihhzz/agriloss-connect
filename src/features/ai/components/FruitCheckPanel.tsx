"use client";

import { useState, useTransition } from "react";
import { checkFruitPhoto, type FruitCheckResult } from "@/features/ai/fruit-check";
import { MIN_SHELF_LIFE_DAYS, RIPENESS_LABEL } from "@/lib/constants";
import { downscaleImage } from "@/lib/image-client";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

/**
 * "Cek Kondisi Buah dengan AI": kirim foto ke Gemini, tampilkan penilaian,
 * lalu pengguna memilih menerapkannya ke form (keputusan tetap di tangan petani).
 */
export function FruitCheckPanel({ file, onApply }: { file: File | null; onApply: (result: FruitCheckResult) => void }) {
  const [result, setResult] = useState<FruitCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const [pending, startTransition] = useTransition();

  const analyze = () => {
    if (!file) return;
    setError(null);
    setApplied(false);
    startTransition(async () => {
      const small = await downscaleImage(file);
      const data = new FormData();
      data.set("photo", small);
      const response = await checkFruitPhoto(data);
      if (response.ok) setResult(response);
      else {
        setResult(null);
        setError(response.message);
      }
    });
  };

  return (
    <div className="rounded-3xl border-2 border-dashed border-leaf-400 bg-white/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-bold">
            <Icon name="sparkle" className="text-leaf-700" /> Cek Kondisi Buah dengan AI
          </p>
          <p className="text-xs text-neutral-700">AI menilai kematangan &amp; perkiraan masa layak dari foto. Hasilnya saran, kamu tetap bisa mengubah.</p>
        </div>
        <button
          type="button"
          onClick={analyze}
          disabled={!file || pending}
          className="rounded-full bg-leaf-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-leaf-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Menganalisis foto…" : file ? "Analisis Foto" : "Pilih foto dulu"}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-4 grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto]" aria-live="polite">
          <div className="flex flex-col gap-1 text-sm">
            <p className="text-lg font-bold">
              {result.buah} · {RIPENESS_LABEL[result.kematangan]}
            </p>
            <p>
              Masih layak diolah ±<b>{result.perkiraan_layak_hari} hari</b>
              {result.perkiraan_layak_hari < MIN_SHELF_LIFE_DAYS && <span className="text-[#8a4b05]"> — di bawah {MIN_SHELF_LIFE_DAYS} hari</span>}
            </p>
            <p className={cn("font-semibold", result.layak_dijual ? "text-leaf-800" : "text-red-700")}>
              <Icon name={result.layak_dijual ? "check-circle" : "warning"} />{" "}
              {result.layak_dijual ? "Layak ditawarkan" : "Tampak tidak layak (busuk/rusak) — sebaiknya tidak ditawarkan"}
            </p>
            <p className="text-neutral-700">
              {result.kondisi} {result.alasan}
            </p>
            {result.saran_olahan.length > 0 && (
              <p className="text-neutral-700">
                Cocok diolah jadi: <b>{result.saran_olahan.join(", ")}</b>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              onApply(result);
              setApplied(true);
            }}
            className="h-fit self-end rounded-full bg-lime px-5 py-2.5 text-sm font-bold hover:brightness-95"
          >
            {applied ? (
              <>
                <Icon name="check" size={16} /> Diterapkan
              </>
            ) : (
              "Terapkan ke form"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
