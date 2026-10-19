import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Track your order" };

interface TrackingPageProps {
  searchParams: Promise<{ orderNumber?: string; phone?: string }>;
}

export default async function OrderTrackingPage({ searchParams }: TrackingPageProps) {
  const { orderNumber, phone } = await searchParams;

  if (orderNumber?.trim() && phone?.trim()) {
    redirect(`/orders/${encodeURIComponent(orderNumber.trim().toUpperCase())}?phone=${encodeURIComponent(phone.trim())}`);
  }

  return (
    <div className="container-page max-w-lg py-16 lg:py-24">
      <p className="eyebrow text-center">Order status</p>
      <h1 className="heading-display mt-3 text-center text-5xl">Track your order</h1>
      <p className="mt-4 text-center text-sm text-stone">
        Enter the order number from your confirmation and the phone number you ordered with.
      </p>

      <form action="/tracking" className="mt-10 space-y-5">
        <div>
          <label htmlFor="orderNumber" className="field-label">
            Order number
          </label>
          <input
            id="orderNumber"
            name="orderNumber"
            required
            defaultValue={orderNumber}
            placeholder="RYZ-XXXXXXX"
            className="field-input uppercase tracking-wider"
          />
        </div>
        <div>
          <label htmlFor="phone" className="field-label">
            Phone number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            defaultValue={phone}
            inputMode="tel"
            placeholder="024 123 4567"
            className="field-input"
          />
        </div>
        <button type="submit" className="btn-primary w-full">
          Track order
        </button>
      </form>
    </div>
  );
}
