"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CreditCard, Loader2, Lock, Smartphone, Wallet } from "lucide-react";
import { clearCart, useCart, useIsHydrated } from "@/lib/cart";
import { formatGhs } from "@/lib/format";
import { GHANA_REGIONS } from "@/lib/shipping";

type PaymentProvider = "CASH_ON_DELIVERY" | "PAYSTACK";

interface Quote {
  lines: { variantId: string; productTitle: string; size: string; quantity: number; totalPesewas: number; available: number }[];
  itemsPricePesewas: number;
  shippingPricePesewas: number;
  discountPricePesewas: number;
  totalPricePesewas: number;
  discount?: { code?: string; valid: boolean; message: string };
}

const initialForm = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  region: "Greater Accra",
  city: "",
  addressLine: "",
  landmark: "",
  ghanaPostGps: "",
};

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-stone">{hint}</p>
      ) : null}
    </div>
  );
}

export default function CheckoutPage() {
  const cart = useCart();
  const hydrated = useIsHydrated();

  const [form, setForm] = useState(initialForm);
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>("CASH_ON_DELIVERY");
  const [discountInput, setDiscountInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string>();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState<string>();
  const [quoteLoading, setQuoteLoading] = useState(false);

  const [otp, setOtp] = useState("");
  const [otpState, setOtpState] = useState<"idle" | "sending" | "sent">("idle");
  const [otpMessage, setOtpMessage] = useState<string>();
  const [cooldown, setCooldown] = useState(0);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const items = useMemo(() => cart.map((i) => ({ variantId: i.variantId, quantity: i.quantity })), [cart]);

  const update = (key: keyof typeof initialForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setFieldErrors((errs) => ({ ...errs, [key]: "" }));
    setFormError(undefined);
  };

  const fetchQuote = useCallback(async () => {
    if (items.length === 0) return;
    setQuoteLoading(true);
    try {
      const res = await fetch("/api/checkout/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region: form.region, discountCode: appliedCode, items }),
      });
      const data = await res.json();
      if (data.success) {
        setQuote(data.quote);
        setQuoteError(undefined);
      } else {
        setQuote(null);
        setQuoteError(data.error);
      }
    } catch {
      setQuoteError("We couldn't load your order total. Check your connection and try again.");
    } finally {
      setQuoteLoading(false);
    }
  }, [items, form.region, appliedCode]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // A code is tied to the number it was sent to.
  useEffect(() => {
    setOtpState("idle");
    setOtp("");
    setOtpMessage(undefined);
  }, [form.customerPhone]);

  const sendOtp = async () => {
    setOtpState("sending");
    setOtpMessage(undefined);
    try {
      const res = await fetch("/api/checkout/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.customerPhone }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpState("sent");
        setCooldown(60);
        setOtpMessage(
          data.devCode ? `Development mode — your code is ${data.devCode}` : "We've sent a 6-digit code by SMS."
        );
      } else {
        setOtpState("idle");
        if (data.fieldErrors?.phone) setFieldErrors((e) => ({ ...e, customerPhone: data.fieldErrors.phone }));
        else setOtpMessage(data.error);
      }
    } catch {
      setOtpState("idle");
      setOtpMessage("We couldn't send a code. Check your connection and try again.");
    }
  };

  const applyDiscount = () => {
    setAppliedCode(discountInput.trim() || undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(undefined);
    setFieldErrors({});

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          paymentProvider,
          otp: paymentProvider === "CASH_ON_DELIVERY" ? otp : undefined,
          discountCode: quote?.discount?.valid ? appliedCode : undefined,
          items,
        }),
      });
      const data = await res.json();

      if (data.success) {
        clearCart();
        window.location.assign(data.redirectUrl);
        return;
      }

      setFieldErrors(data.fieldErrors ?? {});
      setFormError(data.error ?? "Something went wrong. Please try again.");
      if (res.status === 409) fetchQuote();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setFormError("We couldn't reach the server. Check your connection and try again.");
    }
    setSubmitting(false);
  };

  if (!hydrated) {
    return <div className="container-page min-h-[60vh] py-16" aria-busy="true" />;
  }

  if (cart.length === 0) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="heading-display text-4xl">Your bag is empty</h1>
        <p className="mt-3 text-stone">Add a fragrance to your bag before checking out.</p>
        <Link href="/collections/all" className="btn-primary mt-8">
          Shop fragrances
        </Link>
      </div>
    );
  }

  const errorFor = (key: string) => fieldErrors[key] || undefined;
  const inputProps = (key: keyof typeof initialForm) => ({
    id: key,
    name: key,
    value: form[key],
    onChange: update(key),
    "aria-invalid": Boolean(fieldErrors[key]) || undefined,
    "aria-describedby": fieldErrors[key] ? `${key}-error` : undefined,
    className: `field-input ${fieldErrors[key] ? "border-brand-red" : ""}`,
  });

  const total = quote?.totalPricePesewas;

  return (
    <div className="container-page py-10 lg:py-14">
      <h1 className="heading-display text-4xl sm:text-5xl">Checkout</h1>

      {formError && (
        <div role="alert" className="mt-6 border border-brand-red/30 bg-brand-red/5 px-4 py-3 text-sm text-brand-red">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-16">
        <div className="space-y-10">
          <section className="space-y-5">
            <h2 className="text-xs uppercase tracking-label text-ink">1. Contact</h2>
            <Field id="customerName" label="Full name" error={errorFor("customerName")}>
              <input {...inputProps("customerName")} autoComplete="name" required />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="customerPhone"
                label="Mobile number"
                error={errorFor("customerPhone")}
                hint="For delivery updates and verification"
              >
                <input {...inputProps("customerPhone")} type="tel" autoComplete="tel" inputMode="tel" placeholder="024 123 4567" required />
              </Field>
              <Field
                id="customerEmail"
                label={paymentProvider === "PAYSTACK" ? "Email" : "Email (optional)"}
                error={errorFor("customerEmail")}
                hint={paymentProvider === "PAYSTACK" ? "For your payment receipt" : undefined}
              >
                <input {...inputProps("customerEmail")} type="email" autoComplete="email" />
              </Field>
            </div>
          </section>

          <section className="space-y-5">
            <h2 className="text-xs uppercase tracking-label text-ink">2. Delivery address</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="region" label="Region" error={errorFor("region")}>
                <select {...inputProps("region")} autoComplete="address-level1">
                  {GHANA_REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="city" label="City / town" error={errorFor("city")}>
                <input {...inputProps("city")} autoComplete="address-level2" placeholder="East Legon" required />
              </Field>
            </div>
            <Field id="addressLine" label="Street address" error={errorFor("addressLine")}>
              <input {...inputProps("addressLine")} autoComplete="street-address" placeholder="House no. and street" required />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="landmark" label="Nearest landmark (optional)" error={errorFor("landmark")}>
                <input {...inputProps("landmark")} placeholder="Opposite the Shell station" />
              </Field>
              <Field id="ghanaPostGps" label="GhanaPost GPS (optional)" error={errorFor("ghanaPostGps")}>
                <input {...inputProps("ghanaPostGps")} placeholder="GA-123-4567" />
              </Field>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xs uppercase tracking-label text-ink">3. Payment</h2>
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
              {(
                [
                  ["CASH_ON_DELIVERY", Wallet, "Cash on Delivery", "Pay cash or MoMo to the rider"],
                  ["PAYSTACK", CreditCard, "Pay now", "MoMo or card via Paystack"],
                ] as const
              ).map(([value, Icon, title, body]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer gap-3 border p-4 transition-colors ${
                    paymentProvider === value ? "border-ink bg-white" : "border-line hover:border-stone"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentProvider"
                    value={value}
                    checked={paymentProvider === value}
                    onChange={() => setPaymentProvider(value)}
                    className="mt-1 accent-ink"
                  />
                  <span>
                    <span className="flex items-center gap-2 text-sm font-medium text-ink">
                      <Icon size={16} strokeWidth={1.5} /> {title}
                    </span>
                    <span className="mt-0.5 block text-xs text-stone">{body}</span>
                  </span>
                </label>
              ))}
            </div>

            {paymentProvider === "CASH_ON_DELIVERY" && (
              <div className="space-y-3 border border-brand-gold/40 bg-white p-5">
                <p className="flex items-center gap-2 text-sm font-medium text-ink">
                  <Smartphone size={16} strokeWidth={1.5} className="text-brand-gold-dark" />
                  Verify your mobile number
                </p>
                <p className="text-xs text-stone">
                  We text a one-time code to confirm Cash on Delivery orders.
                </p>
                <div className="flex gap-2">
                  <input
                    id="otp"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setFieldErrors((errs) => ({ ...errs, otp: "" }));
                    }}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="6-digit code"
                    aria-label="Verification code"
                    aria-invalid={Boolean(fieldErrors.otp) || undefined}
                    disabled={otpState !== "sent"}
                    className={`field-input flex-1 tracking-[0.3em] ${fieldErrors.otp ? "border-brand-red" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={!form.customerPhone || otpState === "sending" || cooldown > 0}
                    className="btn-outline whitespace-nowrap px-4"
                  >
                    {otpState === "sending" ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : cooldown > 0 ? (
                      `Resend in ${cooldown}s`
                    ) : otpState === "sent" ? (
                      "Resend code"
                    ) : (
                      "Send code"
                    )}
                  </button>
                </div>
                {fieldErrors.otp && <p className="field-error">{fieldErrors.otp}</p>}
                {otpMessage && <p className="text-xs text-stone">{otpMessage}</p>}
              </div>
            )}
          </section>
        </div>

        <aside className="h-fit space-y-6 bg-white p-6 lg:sticky lg:top-24">
          <h2 className="text-xs uppercase tracking-label text-ink">Order summary</h2>

          <ul className="space-y-3 text-sm">
            {cart.map((item) => {
              const line = quote?.lines.find((l) => l.variantId === item.variantId);
              const short = line && line.available < line.quantity;
              return (
                <li key={item.variantId} className="flex justify-between gap-4">
                  <span className="min-w-0">
                    <span className="block truncate text-ink">{item.productName}</span>
                    <span className="text-xs text-stone">
                      {item.size} × {item.quantity}
                    </span>
                    {short && (
                      <span className="block text-xs text-brand-red">
                        {line.available > 0 ? `Only ${line.available} available` : "Sold out"}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-ink">
                    {formatGhs(line?.totalPesewas ?? item.pricePesewas * item.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="flex gap-2 border-t border-line pt-6">
            <input
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyDiscount();
                }
              }}
              placeholder="Discount code"
              aria-label="Discount code"
              className="field-input flex-1 py-2.5 uppercase"
            />
            <button type="button" onClick={applyDiscount} className="btn-outline px-4 py-2.5">
              Apply
            </button>
          </div>
          {quote?.discount && (
            <p className={`-mt-3 text-xs ${quote.discount.valid ? "text-emerald-700" : "text-brand-red"}`}>
              {quote.discount.message}
            </p>
          )}

          <dl className="space-y-2.5 border-t border-line pt-6 text-sm" aria-busy={quoteLoading}>
            <div className="flex justify-between">
              <dt className="text-stone">Subtotal</dt>
              <dd>{quote ? formatGhs(quote.itemsPricePesewas) : "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone">Delivery to {form.region}</dt>
              <dd>{quote ? (quote.shippingPricePesewas === 0 ? "Free" : formatGhs(quote.shippingPricePesewas)) : "—"}</dd>
            </div>
            {quote && quote.discountPricePesewas > 0 && (
              <div className="flex justify-between text-emerald-700">
                <dt>Discount</dt>
                <dd>−{formatGhs(quote.discountPricePesewas)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-4 text-base">
              <dt className="text-ink">Total</dt>
              <dd className="font-medium text-ink">{total !== undefined ? formatGhs(total) : "—"}</dd>
            </div>
          </dl>

          {quoteError && <p className="text-xs text-brand-red">{quoteError}</p>}

          <button type="submit" disabled={submitting || !quote} className="btn-primary w-full">
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Placing order…
              </>
            ) : paymentProvider === "PAYSTACK" ? (
              <>
                <Lock size={14} /> Pay {total !== undefined ? formatGhs(total) : ""}
              </>
            ) : (
              `Place order${total !== undefined ? ` · ${formatGhs(total)}` : ""}`
            )}
          </button>
          <p className="text-center text-xs leading-relaxed text-stone">
            By placing your order you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2">
              terms
            </Link>
            .
          </p>
        </aside>
      </form>
    </div>
  );
}
