"use client";

import { useState } from "react";
import { Loader2, Lock } from "lucide-react";

export function CompletePaymentButton({ orderNumber, phone }: { orderNumber: string; phone: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  const pay = async () => {
    setPending(true);
    setError(undefined);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.success) {
        window.location.assign(data.redirectUrl);
        return;
      }
      setError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    }
    setPending(false);
  };

  return (
    <div className="mt-6 space-y-2">
      <button onClick={pay} disabled={pending} className="btn-primary">
        {pending ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />} Complete payment
      </button>
      {error && <p className="text-xs text-brand-red">{error}</p>}
    </div>
  );
}
