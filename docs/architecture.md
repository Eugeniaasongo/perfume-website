# RYZ Parfums Architecture Overview

## 1. System Architecture
RYZ Parfums is an e-commerce platform built on Next.js App Router (TypeScript strict mode) with Tailwind CSS styling and SQLite/PostgreSQL database managed by Prisma ORM.

```
[ Frontend: Next.js App Router ]
       │
       ├──> Catalog & Search Engine (Postgres full-text / SQLite contains)
       ├──> Payment Engine (Paystack API + Webhook HMAC Verification)
       ├──> Cash on Delivery (COD) Engine + Phone OTP Verification
       └──> Order State Machine + Audit Ledger
```

## 2. Key Modules
- **`src/lib/pricing.ts`**: Regional shipping rates and discount code calculations working strictly in integer pesewas.
- **`src/lib/payments/paystack.ts`**: Paystack payment provider implementation and HMAC sha512 webhook handler.
- **`src/lib/cod.ts`**: Phone OTP generation and COD cash collection reconciliation ledger.
- **`src/lib/orders/state-machine.ts`**: Strictly enforced order state transition machine with audit logging.
