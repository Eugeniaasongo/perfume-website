import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Terms, Delivery & Privacy" };

const sections = [
  {
    id: "brand",
    title: "Fragrance formulation & brand disclaimer",
    body: [
      "RYZ Parfums produces independent, high-concentration Extraits de Parfum. References to third-party designer brands or perfume names (shown as “Inspired by”) describe comparable scent profiles only.",
      "RYZ Parfums is not affiliated with, endorsed by, or associated with any of those brand owners, and their trademarks belong to their respective owners.",
    ],
  },
  {
    id: "delivery",
    title: "Delivery & Cash on Delivery",
    body: [
      "We deliver to all 16 regions of Ghana. Orders within Accra typically arrive in 1–2 working days, and other regions in 2–4 working days. Delivery is free on orders of GHS 500 or more.",
      "Cash on Delivery requires a one-time code sent to your phone. Please have the exact amount (cash or MoMo) ready. Repeatedly refusing delivery without notice may result in Cash on Delivery being disabled for your number.",
    ],
  },
  {
    id: "returns",
    title: "Returns",
    body: [
      "For hygiene reasons we cannot accept returns of opened fragrances. If your order arrives damaged or incorrect, contact us within 48 hours and we will replace it at no cost.",
    ],
  },
  {
    id: "privacy",
    title: "Privacy (Data Protection Act, 2012 — Act 843)",
    body: [
      "We collect only what we need to deliver your order: your name, phone number, delivery address and, optionally, your email address. We use it to fulfil and support your order and never sell it.",
      `Payments made online are processed by Paystack; we never see or store your card or MoMo PIN. To access or delete your data, email ${SITE.email}.`,
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="container-page max-w-3xl py-12 lg:py-16">
      <p className="eyebrow">Policies</p>
      <h1 className="heading-display mt-3 text-5xl">Terms & conditions</h1>
      <p className="mt-6 leading-relaxed text-stone">
        By placing an order with RYZ Parfums you agree to the terms below.
      </p>
      <div className="mt-12 space-y-12">
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <h2 className="font-display text-2xl text-ink">{s.title}</h2>
            <div className="mt-4 space-y-4 leading-relaxed text-stone">
              {s.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
