"use client";

import { useEffect, useRef, useState } from "react";

const number = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

/**
 * Angka yang menghitung naik saat terlihat di layar, mis. "25 Kg".
 * Bagian angka di depan dianimasikan, sisanya (satuan) ditampilkan apa adanya.
 */
export function CountUp({ value }: { value: string }) {
  const match = value.match(/^([\d.,]+)(.*)$/);
  const target = match ? Number(match[1].replace(/\./g, "").replace(",", ".")) : NaN;
  const suffix = match ? match[2].trim() : "";
  const ref = useRef<HTMLSpanElement>(null);
  const [current, setCurrent] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !Number.isFinite(target)) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        if (reduce) {
          setCurrent(target);
          return;
        }
        const start = performance.now();
        const duration = 1200;
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / duration);
          setCurrent(target * (1 - Math.pow(1 - progress, 3))); // ease-out
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [target]);

  if (!Number.isFinite(target)) return <span>{value}</span>;
  return (
    <span ref={ref} aria-label={value}>
      <span aria-hidden="true">
        {current === null ? "0" : number.format(Math.round(current))}
        {/* satuan (mis. Kg) lebih kecil di HP agar angka tidak turun baris */}
        {suffix && <span className="ml-1 text-[0.55em] font-semibold sm:ml-2 sm:text-[1em] sm:font-bold">{suffix}</span>}
      </span>
    </span>
  );
}
