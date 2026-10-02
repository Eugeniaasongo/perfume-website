import React from "react";
import { StorefrontLayoutShell } from "@/components/layout/StorefrontLayoutShell";

export default function TermsPage() {
  return (
    <StorefrontLayoutShell>
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 text-sm text-neutral-800">
        <h1 className="text-2xl font-extrabold uppercase tracking-wider text-black border-b border-neutral-200 pb-2">
          Terms & Conditions
        </h1>
        <p>
          Welcome to RYZ Parfums. By accessing or placing an order on our website, you agree to be bound by these Terms and Conditions and our Privacy Policy compliant with the Ghana Data Protection Act, 2012 (Act 843).
        </p>

        <h2 className="text-base font-bold uppercase tracking-wide text-black pt-4">
          1. Fragrance Formulation & Brand Disclaimer
        </h2>
        <p>
          RYZ Parfums produces independent, high-concentration Extraits de Parfum. Any reference to third-party designer brand names or perfume titles (under &quot;INSPIRED BY&quot;) is used purely for comparative fragrance notes description. RYZ Parfums is not affiliated with, endorsed by, or associated with any third-party brand owners.
        </p>

        <h2 className="text-base font-bold uppercase tracking-wide text-black pt-4">
          2. Cash on Delivery (COD) Policy
        </h2>
        <p>
          Cash on Delivery is available across designated regions in Ghana. Phone verification via OTP is required for all COD orders. Repeated unverified orders or refusal of delivery without prior notice may result in account restriction.
        </p>
      </div>
    </StorefrontLayoutShell>
  );
}
