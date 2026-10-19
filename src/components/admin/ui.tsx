import { ORDER_STATE_LABELS, type OrderState } from "@/lib/orders/state-machine";

const STATUS_TONES: Partial<Record<OrderState, string>> = {
  PENDING_PAYMENT: "bg-amber-50 text-amber-800 ring-amber-200",
  AWAITING_DELIVERY_PAYMENT: "bg-sky-50 text-sky-800 ring-sky-200",
  PAID: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  CONFIRMED: "bg-sky-50 text-sky-800 ring-sky-200",
  PROCESSING: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  SHIPPED: "bg-violet-50 text-violet-800 ring-violet-200",
  DELIVERED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  ON_HOLD: "bg-orange-50 text-orange-800 ring-orange-200",
  PAYMENT_FAILED: "bg-red-50 text-red-800 ring-red-200",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONES[status as OrderState] ?? "bg-neutral-100 text-neutral-700 ring-neutral-200";
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}>
      {ORDER_STATE_LABELS[status as OrderState] ?? status}
    </span>
  );
}

export function PageHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-stone">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function Panel({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-line bg-white ${className}`}>
      {title && <h2 className="border-b border-line px-5 py-3.5 text-sm font-medium text-ink">{title}</h2>}
      <div className="p-5">{children}</div>
    </section>
  );
}
