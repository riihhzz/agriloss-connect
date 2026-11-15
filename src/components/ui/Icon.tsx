import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Set ikon Agriloss.Connect. Semua ikon digambar sendiri dengan gaya yang sama:
 * kanvas 24×24, garis 2px berujung bulat, mengikuti warna teks (currentColor).
 * Dipakai sebagai pengganti emoji agar tampilan konsisten di semua perangkat.
 */
const ICONS = {
  /** Jeruk berdaun: lambang buah yang terselamatkan */
  fruit: (
    <>
      <circle cx="12" cy="14" r="7" />
      <path d="M12 7c0-2.4 1.9-4 4.5-4 0 2.4-1.9 4-4.5 4Z" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11.2a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  /** Titik GPS */
  locate: (
    <>
      <circle cx="12" cy="12" r="6.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </>
  ),
  /** Label harga: hemat */
  tag: (
    <>
      <path d="M3.5 11.5V5a1.5 1.5 0 0 1 1.5-1.5h6.5l9 9-8 8-9-9Z" />
      <circle cx="8" cy="8" r="1.3" fill="currentColor" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  chat: (
    <>
      <path d="M19.5 4h-15A1.5 1.5 0 0 0 3 5.5v10A1.5 1.5 0 0 0 4.5 17H7v3.5l4.5-3.5h8a1.5 1.5 0 0 0 1.5-1.5v-10A1.5 1.5 0 0 0 19.5 4Z" />
      <path d="M8 10.5h.01M12 10.5h.01M16 10.5h.01" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z" />
      <path d="M10 21h4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  logout: (
    <>
      <path d="M9.5 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20h4" />
      <path d="m15 8 4 4-4 4M19 12H9" />
    </>
  ),
  /** Kilau: penanda fitur AI */
  sparkle: (
    <>
      <path d="m11 4 1.7 4.8L17.5 10.5l-4.8 1.7L11 17l-1.7-4.8L4.5 10.5l4.8-1.7L11 4Z" />
      <path d="M18.5 15.5v4M16.5 17.5h4" />
    </>
  ),
  qr: (
    <>
      <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1" />
      <rect x="14" y="3.5" width="6.5" height="6.5" rx="1" />
      <rect x="3.5" y="14" width="6.5" height="6.5" rx="1" />
      <path d="M14 14h2.5v2.5H14zM18.5 18.5h2M20.5 14v2M14 20.5h2" />
    </>
  ),
  bank: (
    <>
      <path d="M3 9.5 12 4l9 5.5" />
      <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20.5h18" />
    </>
  ),
  wallet: (
    <>
      <path d="M19 7V5.5A1.5 1.5 0 0 0 17.5 4h-12A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />
      <path d="M3 6.5A2.5 2.5 0 0 0 5.5 9h13A1.5 1.5 0 0 1 20 10.5V15h-4a2 2 0 0 1 0-4h4" />
    </>
  ),
  cash: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 9.5v.01M18 14.5v.01" />
    </>
  ),
  "arrow-down": <path d="M12 4v16M6 14l6 6 6-6" />,
  "arrow-up": <path d="M12 20V4M6 10l6-6 6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
      <path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
    </>
  ),
  phone: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M11 18.5h2" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  x: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  "check-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.8 2.8L16 9.5" />
    </>
  ),
  warning: (
    <>
      <path d="M12 4 2.5 20h19L12 4Z" />
      <path d="M12 10v4.5M12 17.2h.01" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h9M19 7h1M4 17h1M11 17h9" />
      <circle cx="16" cy="7" r="2.5" />
      <circle cx="8" cy="17" r="2.5" />
    </>
  ),
  printer: (
    <>
      <path d="M7 8V4h10v4" />
      <path d="M7 17H5.5A1.5 1.5 0 0 1 4 15.5v-5A2.5 2.5 0 0 1 6.5 8h11a2.5 2.5 0 0 1 2.5 2.5v5a1.5 1.5 0 0 1-1.5 1.5H17" />
      <path d="M7 14h10v6H7z" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("inline-block shrink-0 align-[-0.2em]", className)}
    >
      {ICONS[name]}
    </svg>
  );
}
