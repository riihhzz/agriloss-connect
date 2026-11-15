"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Button> & {
  pendingText?: string;
  /** Status loading manual (untuk form yang memakai onSubmit, bukan prop action) */
  pending?: boolean;
};

/** Tombol submit yang otomatis nonaktif & menampilkan teks loading saat form diproses. */
export function SubmitButton({ children, pendingText = "Memproses...", disabled, pending: pendingProp, ...props }: Props) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <Button type="submit" disabled={pending || disabled} aria-busy={pending} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}
