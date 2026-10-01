# RYZ Parfums Payments & COD Specification

## 1. Integer Pesewas Financial Rule
All prices, order totals, shipping fees, and discounts are represented as non-negative integers representing pesewas (1 GHS = 100 pesewas). Floating-point currency calculations are strictly prohibited.

## 2. Paystack Integration Flow
1. Client submits checkout details.
2. Server computes order total from database prices and creates order with `PENDING_PAYMENT` status.
3. Server initializes transaction with Paystack API sending `orderId` in metadata.
4. Paystack webhook receives `charge.success` event, verifies `x-paystack-signature` HMAC sha512 header, verifies exact amount match, and records transaction in `PaymentLedger` table atomically updating order to `PAID`.
5. Duplicate webhooks are safely ignored via unique `reference` constraints.

## 3. Cash on Delivery (COD) Flow
1. Order created with `AWAITING_DELIVERY_PAYMENT` status after phone OTP verification.
2. Upon delivery, rider collects cash or MoMo payment.
3. Admin/rider logs collection amount in `CodReconciliationLog`.
4. Exact match updates status to `DELIVERED`; discrepancies automatically flag order as `ON_HOLD`.
