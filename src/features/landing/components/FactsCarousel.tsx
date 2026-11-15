"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Mascot, type MascotPose } from "@/components/ui/Mascot";
import { cn } from "@/lib/utils";

type Fact = { title: string; body: string; pose: MascotPose; source?: string };

const FACTS: Fact[] = [
  {
    title: "Tahukah kamu?",
    body: "Agriloss.Connect hadir sebagai platform kolaborasi yang menghubungkan petani dan UMKM dalam mengoptimalkan potensi hasil pertanian. Kami percaya bahwa setiap hasil panen memiliki nilai dan setiap peluang dapat menciptakan dampak.",
    pose: "point",
  },
  {
    title: "Food loss itu nyata",
    body: "Kajian Bappenas memperkirakan Indonesia kehilangan 23–48 juta ton pangan per tahun (2000–2019), setara 115–184 kg per orang per tahun, dengan kerugian ekonomi sekitar Rp213–551 triliun per tahun.",
    pose: "shock",
    source: "Bappenas, Laporan Kajian Food Loss and Waste di Indonesia (2021)",
  },
  {
    title: "Buah tak sempurna, tetap bernilai",
    body: "Buah yang tergores, terlalu matang, atau tidak lolos sortir pasar masih layak diolah menjadi es krim, selai, jus, dan keripik. Di sinilah UMKM berperan mengubah sisa panen menjadi produk bernilai jual.",
    pose: "think",
  },
];

/** Posisi kartu yang menempel, harus sama dengan kelas `top-24` (96px). */
const STICKY_TOP = 96;

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeReduced(callback: () => void) {
  const media = window.matchMedia(REDUCED_QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

/** true bila pengguna meminta animasi dikurangi di pengaturan perangkat. */
function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

/**
 * Kartu "Tahukah kamu?" dengan scroll-parallax:
 * kartu menempel di layar, fakta berganti mengikuti posisi scroll,
 * maskot/teks/dekorasi bergerak dengan kecepatan berbeda.
 * Jika reduced-motion aktif, berubah menjadi carousel klik biasa.
 */
export function FactsCarousel() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(0); // 0..1 sepanjang seksi
  const [manualIndex, setManualIndex] = useState(0);
  // Kartu menempel di tengah layar (bukan di atas) agar tidak menyisakan ruang kosong di bawahnya
  const [stickyTop, setStickyTop] = useState(STICKY_TOP);
  const stickyTopRef = useRef(STICKY_TOP);

  useEffect(() => {
    if (reduced) return;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const section = sectionRef.current;
      const card = cardRef.current;
      if (!section || !card) return;
      const top = Math.max(STICKY_TOP, Math.round((window.innerHeight - card.offsetHeight) / 2));
      stickyTopRef.current = top;
      setStickyTop(top);
      const distance = section.offsetHeight - card.offsetHeight;
      const scrolled = top - section.getBoundingClientRect().top;
      setProgress(Math.min(1, Math.max(0, scrolled / Math.max(distance, 1))));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    frame = requestAnimationFrame(measure);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduced]);

  const count = FACTS.length;
  const scaled = progress * count;
  const active = reduced ? manualIndex : Math.min(count - 1, Math.floor(scaled));
  // progres di dalam slide aktif (0..1), dipakai untuk efek parallax
  const local = reduced ? 0.5 : Math.min(1, scaled - active);

  /** Klik titik: gulir ke posisi slide tersebut (atau ganti langsung bila reduced-motion). */
  const goTo = (index: number) => {
    if (reduced) {
      setManualIndex(index);
      return;
    }
    const section = sectionRef.current;
    const card = cardRef.current;
    if (!section || !card) return;
    const distance = section.offsetHeight - card.offsetHeight;
    const sectionTop = window.scrollY + section.getBoundingClientRect().top - stickyTopRef.current;
    window.scrollTo({ top: sectionTop + ((index + 0.5) / count) * distance, behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      id="tentang"
      aria-roledescription="carousel"
      aria-label="Fakta food loss"
      className="relative scroll-mt-24"
      // tinggi seksi = ruang scroll; setiap fakta mendapat ±55% tinggi layar
      style={reduced ? undefined : { height: `calc(${count} * 55vh + 24rem)` }}
    >
      <div ref={cardRef} className={cn(!reduced && "sticky")} style={reduced ? undefined : { top: stickyTop }}>
        <div className="relative overflow-hidden rounded-4xl bg-leaf-700 p-6 text-white shadow-card sm:p-10">
          {/* dekorasi latar: bergerak lebih lambat dari konten (lapisan parallax) */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-leaf-600/60"
            style={{ transform: `translateY(${progress * 120}px)` }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-lime/10"
            style={{ transform: `translateY(${progress * -160}px)` }}
          />

          <div className="relative grid items-center gap-6 md:grid-cols-[minmax(0,18rem)_1fr] md:gap-10">
            {/* panel maskot */}
            <div className="relative mx-auto flex aspect-square w-44 items-end justify-center overflow-hidden rounded-3xl bg-leaf-100 sm:w-60 md:w-full">
              <span
                aria-hidden="true"
                className="absolute inset-x-6 bottom-4 h-6 rounded-full bg-leaf-300/70 blur-md"
              />
              {FACTS.map((fact, index) => (
                <div
                  key={fact.title}
                  className="absolute inset-0 flex items-end justify-center transition-[opacity,transform] duration-500 ease-out"
                  style={{
                    opacity: index === active ? 1 : 0,
                    transform:
                      index === active
                        ? `translateY(${(0.5 - local) * 28}px)`
                        : `translateY(${index < active ? -40 : 40}px) scale(0.9)`,
                  }}
                  aria-hidden={index !== active}
                >
                  <Mascot pose={fact.pose} width={240} className="w-4/5 translate-y-3" />
                </div>
              ))}
            </div>

            {/* teks: semua slide ditumpuk di sel grid yang sama agar tinggi kartu stabil */}
            <div className="grid" aria-live="polite">
              {FACTS.map((fact, index) => (
                <div
                  key={fact.title}
                  className="col-start-1 row-start-1 transition-[opacity,transform] duration-500 ease-out"
                  style={{
                    opacity: index === active ? 1 : 0,
                    transform:
                      index === active ? `translateY(${(0.5 - local) * 12}px)` : `translateY(${index < active ? -24 : 24}px)`,
                    pointerEvents: index === active ? "auto" : "none",
                  }}
                  aria-hidden={index !== active}
                >
                  <p className="text-sm font-semibold text-lime">
                    {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
                  </p>
                  <h2 className="mt-1 text-3xl font-bold text-sun sm:text-4xl">{fact.title}</h2>
                  <p className="mt-4 text-base leading-relaxed sm:text-lg">{fact.body}</p>
                  {fact.source && <p className="mt-3 text-xs text-leaf-200">Sumber: {fact.source}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* navigasi titik + petunjuk scroll */}
          <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3 md:pl-[calc(18rem+2.5rem)]">
            <div className="flex gap-2" role="tablist" aria-label="Pilih fakta">
              {FACTS.map((fact, index) => (
                <button
                  key={fact.title}
                  type="button"
                  role="tab"
                  aria-selected={index === active}
                  aria-label={`Fakta ${index + 1}: ${fact.title}`}
                  onClick={() => goTo(index)}
                  className={cn(
                    "h-3 rounded-full transition-all duration-300",
                    index === active ? "w-8 bg-sun" : "w-3 bg-leaf-400 hover:bg-leaf-300",
                  )}
                />
              ))}
            </div>
            {!reduced && (
              <p className="flex items-center gap-2 text-xs text-leaf-100" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-bounce">
                  <path d="M12 5v14M6 13l6 6 6-6" />
                </svg>
                Gulir untuk fakta berikutnya
              </p>
            )}
          </div>

          {/* bilah progres scroll */}
          {!reduced && (
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-leaf-800/60" aria-hidden="true">
              <div className="h-full bg-sun transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
