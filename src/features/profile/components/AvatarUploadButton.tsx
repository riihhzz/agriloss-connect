"use client";

import { useRef, useTransition } from "react";
import { updateAvatar } from "@/features/profile/actions";
import { buttonClass } from "@/components/ui/Button";
import { MAX_IMAGE_BYTES } from "@/lib/constants";

/** Tombol "Ubah Foto": memilih file langsung mengunggah. */
export function AvatarUploadButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        className={buttonClass("lime", "md", "min-w-36 font-bold")}
      >
        {pending ? "Mengunggah..." : "Ubah Foto"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label="Pilih foto profil"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          if (file.size > 2 * 1024 * 1024 || file.size > MAX_IMAGE_BYTES) {
            alert("Ukuran foto profil maksimal 2 MB.");
            return;
          }
          const data = new FormData();
          data.set("avatar", file);
          startTransition(() => updateAvatar(data));
        }}
      />
    </>
  );
}
