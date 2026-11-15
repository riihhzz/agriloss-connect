import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

const CONTROL =
  "w-full rounded-md bg-field px-4 py-3 text-sm text-ink shadow-field outline-none transition " +
  "placeholder:text-neutral-500 focus:ring-2 focus:ring-leaf-700 disabled:opacity-60";

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  className?: string;
  children: ReactNode;
};

/** Label + kontrol form, mengikuti gaya input abu dengan bayangan tipis di desain. */
export function Field({ label, htmlFor, hint, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-neutral-600">{hint}</p>}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(CONTROL, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(CONTROL, "min-h-24 resize-y", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(CONTROL, "select-chevron", className)} {...props}>
      {children}
    </select>
  );
}
