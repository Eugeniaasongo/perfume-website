# RYZ Parfums Architecture Overview

Next.js App Router (TypeScript strict) + Tailwind CSS, PostgreSQL via Prisma.

```
src/app/(store)/        Storefront: home, collections, product, search, cart, checkout, tracking, order status
src/app/admin/          Admin portal (password + signed session cookie, protected by src/middleware.ts)
src/app/api/            checkout, checkout/quote, checkout/otp, webhooks/paystack, cron/expire-orders, search
```

## Key modules
- `src/lib/orders/checkout.ts` — input validation (zod), server-side pricing (`quoteCart`), atomic order creation. Stock is reserved with conditional decrements so concurrent checkouts can never oversell.
- `src/lib/orders/state-machine.ts` — allowed status transitions, audit log, stock release on cancellation/failed payment/return, expiry of unpaid orders.
- `src/lib/otp.ts` + `src/lib/notifications/sms.ts` — hashed, expiring, single-use phone codes with resend cooldown and attempt limits; SMS via Arkesel.
- `src/lib/payments/paystack.ts` — Paystack initialization and webhook processing (constant-time HMAC check, idempotent ledger, amount verification).
- `src/lib/cod.ts` — rider cash collection and reconciliation.
- `src/lib/orders/refunds.ts` — full/partial refunds (Paystack API or recorded manual COD refunds).
- `src/lib/notifications/orders.ts` — customer SMS per order step, new-order alerts, back-in-stock texts; every message is logged in `NotificationLog` and failures never undo a sale.
- `src/lib/reports.ts` — sales report and CSV export.
- `src/lib/auth/session.ts` — HMAC-signed admin session tokens (Web Crypto, works in middleware and Node).
- `src/lib/services/catalog.ts` — catalog queries and the runtime "Inspired by" configuration.
