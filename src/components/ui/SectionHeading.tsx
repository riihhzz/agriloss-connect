import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Judul seksi dengan satu kata berwarna hijau, mis. "Katalog <Produk> Olahan". */
export function SectionHeading({
  title,
  description,
  align = "center",
  className,
  action,
}: {
  title: ReactNode;
  description?: string;
  align?: "center" | "left";
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className={cn("flex flex-col gap-2", align === "center" && "items-center")}>
        <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">{title}</h2>
        {description && <p className="max-w-xl text-sm text-neutral-700 sm:text-base">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Highlight({ children }: { children: ReactNode }) {
  return <span className="text-leaf-700">{children}</span>;
}
