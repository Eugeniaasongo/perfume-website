"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/app/admin/actions";

export function ActionForm({
  action,
  children,
  className,
  submitLabel,
  submitClassName = "rounded-md bg-ink px-4 py-2 text-sm font-medium text-ivory hover:bg-brand-gold-dark disabled:opacity-50",
  confirm,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  children?: React.ReactNode;
  className?: string;
  submitLabel: string;
  submitClassName?: string;
  confirm?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form
      action={formAction}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
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
