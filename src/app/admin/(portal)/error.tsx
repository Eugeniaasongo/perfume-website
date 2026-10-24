"use client";

import { useEffect } from "react";

export default function AdminError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <h1 className="text-xl font-semibold text-ink">Something went wrong</h1>
      <p className="mt-2 text-sm text-stone">
        If the site was just updated, reloading usually fixes this.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 rounded-md bg-ink px-4 py-2 text-sm font-medium text-ivory hover:bg-brand-gold-dark"
      >
        Reload page
      </button>
    </div>
  );
}
