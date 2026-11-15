import Image from "next/image";
import { cn } from "@/lib/utils";

export type MascotPose = "wave" | "point" | "think" | "shock" | "sad" | "confused";

const POSES: Record<MascotPose, { src: string; alt: string; ratio: number }> = {
  wave: { src: "/images/mascot/wave.png", alt: "Maskot Agriloss melambaikan tangan", ratio: 800 / 600 },
  point: { src: "/images/mascot/point.png", alt: "Maskot Agriloss menunjuk ke atas", ratio: 800 / 600 },
  think: { src: "/images/mascot/think.png", alt: "Maskot Agriloss sedang berpikir", ratio: 800 / 600 },
  shock: { src: "/images/mascot/shock.png", alt: "Maskot Agriloss terkejut", ratio: 800 / 600 },
  sad: { src: "/images/mascot/sad.png", alt: "Maskot Agriloss sedih", ratio: 600 / 450 },
  confused: { src: "/images/mascot/confused.png", alt: "Maskot Agriloss heran", ratio: 600 / 450 },
};

/** Maskot jeruk Agriloss. `animated` (khusus pose wave) memakai versi berlapis yang bergerak. */
export function Mascot({
  pose = "wave",
  width = 320,
  className,
  priority,
  animated = false,
}: {
  pose?: MascotPose;
  width?: number;
  className?: string;
  priority?: boolean;
  animated?: boolean;
}) {
  if (animated && pose === "wave") return <AnimatedMascot width={width} className={className} />;

  const { src, alt, ratio } = POSES[pose];
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={Math.round(width * ratio)}
      priority={priority}
      className={cn("h-auto select-none drop-shadow-sm", className)}
    />
  );
}

const LAYER = "/images/mascot/layers";

/**
 * Maskot hidup dari lapisan PNG (600×800, posisi sudah sejajar):
 * badan bernapas, tangan melambai, daun bergoyang, mata berkedip.
 * Hover: melambai lebih semangat & mata tersenyum.
 */
function AnimatedMascot({ width, className }: { width: number; className?: string }) {
  const layer = (name: string, extra?: string) => (
    // eslint-disable-next-line @next/next/no-img-element -- lapisan kecil yang ditumpuk & dianimasikan dengan CSS
    <img src={`${LAYER}/${name}.png`} alt="" aria-hidden="true" draggable={false} className={cn("mascot-layer", extra)} />
  );

  return (
    <div
      role="img"
      aria-label="Maskot Agriloss melambaikan tangan"
      className={cn("mascot group relative aspect-[3/4] select-none drop-shadow-sm", className)}
      style={/(^|\s)w-/.test(className ?? "") ? undefined : { width }}
    >
      <div className="mascot-body absolute inset-0">
        {/* Kedua lengan berada di belakang badan & kepala, seperti gambar aslinya */}
        {layer("tangan-kiri")}
        {layer("tangan-kanan-utama", "mascot-arm")}
        {layer("badan")}
        <div className="mascot-head absolute inset-0">
          {layer("daun", "mascot-leaf")}
          {layer("kepala")}
          {layer("wajah")}
          {layer("pipi-kiri")}
          {layer("pipi-kanan")}
          {layer("mata-kiri-normal", "mascot-eyes-open")}
          {layer("mata-kanan-normal", "mascot-eyes-open")}
          {layer("mata-kiri-merem", "mascot-eyes-closed")}
          {layer("mata-kanan-merem", "mascot-eyes-closed")}
          {layer("mulut-normal")}
        </div>
      </div>
    </div>
  );
}
