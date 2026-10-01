# RYZ Parfums Go-Live & Legal Risk Assessment Checklist

## 1. Third-Party Brand & Legal Risk Assessment
- [x] **Trademark Comparative Phrasing Review**: Ensure all product listings featuring inspired scents use comparative phrasing (e.g. "INSPIRED BY Creed Aventus") and explicit disclaimers clarifying that RYZ Parfums has no affiliation with third-party trademark owners.
- [x] **No Third-Party Bottle Imagery**: Ensure only proprietary RYZ clear glass bottles and custom box designs are used in commercial photography.
- [x] **Runtime Inspired-By Toggle**: Verified that admin toggle controls can instantly hide comparative labels or inspiration tags globally without requiring code redeployment.

## 2. Payments & Financial Integrity Checklist
- [x] All monetary calculations strictly performed in integer pesewas (never float).
- [x] Paystack webhook `x-paystack-signature` HMAC sha512 verification active.
- [x] Webhook idempotency enforced via `PaymentLedger` unique reference constraints.
- [x] COD phone OTP verification active to eliminate ghost orders.
- [x] COD rider cash collection logged in `CodReconciliationLog` with automatic discrepancy flagging.

## 3. Ghana Data Protection Act, 2012 (Act 843)
- [x] Clear terms and privacy statements provided.
- [x] Minimal customer PII collection required for fulfillment.
