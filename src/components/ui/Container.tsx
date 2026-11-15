import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

/** Judul halaman dashboard: "Profil" + subjudul. */
export function PageTitle({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">{title}</h1>
        {description && <p className="mt-2 text-sm text-neutral-800 sm:text-base">{description}</p>}
      </div>
      {action && <div className="self-start sm:self-auto">{action}</div>}
    </div>
  );
}
