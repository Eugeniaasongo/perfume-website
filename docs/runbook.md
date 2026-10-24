# DHA Perfumes Operations Runbook

## Webhook failure recovery
1. Open `/admin/orders?status=PENDING_PAYMENT`.
2. Check the order's reference in the Paystack dashboard.
3. If Paystack shows `success`, open the order and mark it as paid. Unpaid orders are cancelled automatically after an hour and their stock returned.
4. Payments that arrive for an already-cancelled order are logged in the order's activity as "needs review"; refund them from Paystack or re-create the order.

## COD discrepancy reconciliation
1. A collection that doesn't match the total puts the order **On hold** (dashboard tile turns orange).
2. Contact the rider and customer to resolve the difference.
3. Record the corrected amount on the order page; an exact match marks it delivered.

## Daily fulfilment
1. **Orders → Open (needs action)** lists everything waiting on you.
2. COD orders: call the customer if needed, then **Mark as confirmed** → **Mark as preparing**. Paid orders go straight to **Mark as preparing**.
3. Print the **Packing slip** (top of the order page), pack, tick each line.
4. **Send out for delivery**: enter the rider's name and phone. The customer gets an SMS with the rider's details and, for COD, the amount to have ready.
5. COD: when the rider returns, **Record cash collection** marks the order delivered (or on hold if the amount differs). Paid orders: **Mark as delivered**.

Every step texts the customer automatically; each message and whether it was sent is listed under **Messages to customer** on the order.

## Refunds
Use the **Refund** panel on the order (full or partial):
- Paid online: the money goes back through Paystack automatically.
- Cash on Delivery: pay the customer back in cash/MoMo first, then record it. Only cash a rider has recorded collecting can be refunded.
A full refund before dispatch puts the bottles back in stock. If Paystack confirms a refund but saving it fails, the error names the Paystack reference — note it in the order before retrying.

## Refused deliveries and blocking COD
Mark the order "returned / refused" — stock is returned and the refusal counts against the customer's number. After 2 refusals Cash on Delivery is blocked for that number (they can still pay online). Block or allow a number by hand from the **Customer** panel on any of their orders.

## Customers who didn't finish paying
Unpaid online orders show a **Complete payment** button on the customer's order page. If they never pay, the order is cancelled after an hour and its stock released.

## Back in stock
Customers can ask to be texted when a sold-out size returns. Setting that size's stock above 0 on **Products & stock** texts everyone waiting, once.

## Reports
**Reports** shows sales, average order, money received, COD still to collect, top fragrances and losses for 7/30/90 days. **Export CSV** downloads every order in the period for your accountant.

## Admin access
Rotate `ADMIN_PASSWORD` in the hosting environment to change the password. Rotating `SESSION_SECRET` signs everyone out immediately.
