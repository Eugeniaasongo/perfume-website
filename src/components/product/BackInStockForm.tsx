"use client";

import { useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";

export function BackInStockForm({ variantId, size }: { variantId: string; size: string }) {
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string>();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    setError(undefined);
    try {
      const res = await fetch("/api/back-in-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, phone }),
      });
      const data = await res.json();
      if (data.success) {
        setState("done");
        return;
      }
      setError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("We couldn't reach the server. Please try again.");
    }
    setState("idle");
  };

  if (state === "done") {
    return (
      <p className="flex items-center gap-2 border border-line bg-white p-4 text-sm text-ink">
        <Check size={16} className="text-emerald-700" /> We&apos;ll text you as soon as the {size} is back.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2 border border-line bg-white p-4">
      <p className="flex items-center gap-2 text-sm text-ink">
        <Bell size={16} strokeWidth={1.5} className="text-brand-gold-dark" /> Text me when the {size} is back
      </p>
      <div className="flex gap-2">
        <input
          type="tel"
          inputMode="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="024 123 4567"
          aria-label="Mobile number"
          className="field-input flex-1 py-2.5"
        />
        <button type="submit" disabled={state === "sending"} className="btn-outline px-4 py-2.5">
          {state === "sending" ? <Loader2 size={14} className="animate-spin" /> : "Notify me"}
        </button>
      </div>
      {error && <p className="field-error">{error}</p>}
    </form>
  );
}
