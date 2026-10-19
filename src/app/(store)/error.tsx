"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page max-w-lg py-24 text-center">
      <h1 className="heading-display text-4xl">Something went wrong</h1>
      <p className="mt-4 text-sm text-stone">We couldn&apos;t load this page. Please try again.</p>
      <div className="mt-8 flex justify-center gap-3">
        <button onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-outline">
          Home
        </Link>
      </div>
    </div>
  );
}
