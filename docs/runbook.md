# RYZ Parfums Operations Runbook

## Webhook failure recovery
1. Open `/admin/orders?status=PENDING_PAYMENT`.
2. Check the order's reference in the Paystack dashboard.
3. If Paystack shows `success`, open the order and mark it as paid. Unpaid orders are cancelled automatically after an hour and their stock returned.
4. Payments that arrive for an already-cancelled order are logged in the order's activity as "needs review"; refund them from Paystack or re-create the order.

## COD discrepancy reconciliation
1. A collection that doesn't match the total puts the order **On hold** (dashboard tile turns orange).
2. Contact the rider and customer to resolve the difference.
3. Record the corrected amount on the order page; an exact match marks it delivered.

## Refused deliveries
Mark the order "returned / refused" — stock is returned automatically. Repeat offenders can be blocked from Cash on Delivery by setting `isBlacklisted` on their `Customer` record.

## Admin access
Rotate `ADMIN_PASSWORD` in the hosting environment to change the password. Rotating `SESSION_SECRET` signs everyone out immediately.
