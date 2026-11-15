"use client";

import { useId, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { buttonClass } from "@/components/ui/Button";
import { Mascot } from "@/components/ui/Mascot";

type Props = {
  /** Judul dialog, mis. "Keluar dari akun?" */
  title: string;
  /** Penjelasan singkat di bawah judul */
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  className?: string;
  children: ReactNode;
};

/**
 * Tombol di dalam <form> yang membuka dialog konfirmasi bergaya Agriloss
 * sebelum form dikirim. Memakai <dialog> bawaan browser (Esc untuk menutup,
 * fokus terkunci di dalam dialog).
 */
export function ConfirmSubmit({
  title,
  message,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  tone = "danger",
  className,
  children,
}: Props) {
  const { pending } = useFormStatus();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = () => dialogRef.current?.close();
  const confirm = () => {
    close();
    triggerRef.current?.form?.requestSubmit();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={pending}
        className={className}
        onClick={() => dialogRef.current?.showModal()}
      >
        {pending ? "Memproses..." : children}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-auto w-[min(92vw,26rem)] rounded-4xl bg-leaf-50 p-0 text-ink shadow-2xl backdrop:bg-leaf-900/50 backdrop:backdrop-blur-sm open:animate-[confirm-pop_180ms_ease-out]"
        onClick={(event) => {
          // klik di luar kartu (area backdrop) menutup dialog
          if (event.target === dialogRef.current) close();
        }}
      >
        <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-8 text-center">
          <Mascot pose="shock" width={96} />
          <h2 id={titleId} className="text-2xl font-bold">
            {title}
          </h2>
          <p className="text-sm text-neutral-700">{message}</p>
          <div className="mt-3 flex w-full flex-col-reverse gap-3 sm:flex-row">
            <button type="button" onClick={close} className={buttonClass("outline", "md", "flex-1 bg-white")} autoFocus>
              {cancelLabel}
            </button>
            <button type="button" onClick={confirm} className={buttonClass(tone, "md", "flex-1")}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
