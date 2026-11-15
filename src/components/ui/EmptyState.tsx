import type { ReactNode } from "react";
import { Mascot, type MascotPose } from "@/components/ui/Mascot";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  pose = "think",
  action,
  className,
}: {
  title: string;
  description?: string;
  pose?: MascotPose;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("card-glass flex flex-col items-center gap-3 rounded-3xl px-6 py-10 text-center", className)}>
      <Mascot pose={pose} width={110} />
      <h3 className="text-lg font-bold">{title}</h3>
      {description && <p className="max-w-sm text-sm text-neutral-700">{description}</p>}
      {action}
    </div>
  );
}
