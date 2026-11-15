import type { UserRole } from "@/types/database";

/**
 * Ikon peran bergaya Agriloss: garis hijau tua tebal + aksen oranye (warna maskot).
 * Petani = caping & tunas, UMKM = toko dengan kanopi.
 */
export function RoleIcon({ role, size = 56 }: { role: UserRole; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 64 64",
    fill: "none",
    stroke: "#1f6f2a",
    strokeWidth: 3.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (role === "petani") {
    return (
      <svg {...common}>
        {/* caping */}
        <path d="M8 27 L32 13 L56 27 Z" fill="#f79b29" />
        <path d="M24 22.5 Q32 19 40 22.5" />
        {/* wajah */}
        <circle cx="32" cy="34" r="7" fill="#ffd9b8" />
        {/* badan / rompi hijau */}
        <path d="M18 56 C18 46 24 42 32 42 C40 42 46 46 46 56" fill="#c8f55a" />
        <path d="M32 42 V56" />
        {/* tunas */}
        <path d="M52 56 V44" />
        <path d="M52 47 C52 42 56 40 60 40 C60 44 57 47 52 47 Z" fill="#8cc06a" />
        <path d="M52 50 C52 46 48 44 45 44 C45 47 47 50 52 50 Z" fill="#8cc06a" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      {/* kanopi bergaris */}
      <path d="M8 22 L13 10 H51 L56 22 Z" fill="#f79b29" />
      <path d="M8 22 C8 26 14 26 14 22 C14 26 20 26 20 22 C20 26 26 26 26 22 C26 26 32 26 32 22 C32 26 38 26 38 22 C38 26 44 26 44 22 C44 26 50 26 50 22 C50 26 56 26 56 22" fill="#fff" />
      {/* bangunan */}
      <path d="M12 26 V54 H52 V26" fill="#c8f55a" />
      {/* pintu */}
      <path d="M22 54 V38 H32 V54" fill="#fff" />
      {/* etalase dengan buah */}
      <rect x="37" y="36" width="10" height="9" rx="1.5" fill="#fff" />
      <circle cx="42" cy="41" r="2.2" fill="#f79b29" stroke="none" />
      <path d="M6 54 H58" />
    </svg>
  );
}
