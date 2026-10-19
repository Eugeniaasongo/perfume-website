"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";

interface ToastDetail {
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
}

const TOAST_EVENT = "ryz:toast";

export function showToast(detail: ToastDetail) {
  window.dispatchEvent(new CustomEvent<ToastDetail>(TOAST_EVENT, { detail }));
}

export function Toaster() {
  const [toast, setToast] = useState<(ToastDetail & { id: number }) | null>(null);

  useEffect(() => {
    const onToast = (e: Event) => setToast({ ...(e as CustomEvent<ToastDetail>).detail, id: Date.now() });
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4 sm:justify-end sm:px-6">
      {toast && (
        <div
          key={toast.id}
          className="pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 bg-ink p-4 text-ivory shadow-2xl"
        >
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-gold text-ink">
            <Check size={12} strokeWidth={3} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{toast.title}</p>
            {toast.description && <p className="mt-0.5 truncate text-xs text-ivory/60">{toast.description}</p>}
            {toast.href && (
              <Link href={toast.href} className="mt-2 inline-block text-xs uppercase tracking-label text-brand-gold hover:text-brand-gold-light">
                {toast.hrefLabel ?? "View"}
              </Link>
            )}
          </div>
          <button onClick={() => setToast(null)} aria-label="Dismiss" className="text-ivory/50 hover:text-ivory">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
