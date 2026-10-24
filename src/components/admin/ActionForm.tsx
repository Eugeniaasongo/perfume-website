"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import type { ActionResult } from "@/app/admin/actions";

export function ActionForm({
  action,
  children,
  className,
  submitLabel,
  submitClassName = "rounded-md bg-ink px-4 py-2 text-sm font-medium text-ivory hover:bg-brand-gold-dark disabled:opacity-50",
  confirm,
  resetOnSuccess,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  children?: React.ReactNode;
  className?: string;
  submitLabel: string;
  submitClassName?: string;
  confirm?: string;
  /** Clear the fields after a successful save (for "add" forms). */
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && resetOnSuccess) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={formRef}
      className={className}
      // Submitting through startTransition instead of the `action` prop stops React from
      // resetting the form, so a rejected save keeps everything the admin typed.
      onSubmit={(e) => {
        e.preventDefault();
        if (confirm && !window.confirm(confirm)) return;
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
    >
      {children}
      <button type="submit" disabled={pending} className={submitClassName}>
        {pending ? "Saving…" : submitLabel}
      </button>
      {state && (
        <p role="status" className={`text-xs ${state.ok ? "text-emerald-700" : "text-brand-red"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
