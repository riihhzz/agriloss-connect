"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import type { ActionState } from "@/types/database";

type ServerAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Seperti useActionState, tetapi form TIDAK dikosongkan setelah submit.
 * (React 19 otomatis me-reset form yang memakai prop `action`; untuk form
 * login/daftar, isian harus tetap ada ketika validasi gagal.)
 */
export function usePreservedFormAction(action: ServerAction) {
  const [state, dispatch, pending] = useActionState(action, null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Sertakan tombol yang ditekan (name/value), mis. decision=lanjutkan
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const formData = new FormData(event.currentTarget, submitter);
    startTransition(() => dispatch(formData));
  };

  return { state, onSubmit, pending };
}
