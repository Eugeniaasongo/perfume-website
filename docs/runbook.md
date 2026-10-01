# RYZ Parfums Operations Runbook

## 1. Webhook Failure Recovery
If Paystack webhooks fail or experience network timeouts:
1. Access Admin Portal at `/admin`.
2. Locate order in `PENDING_PAYMENT` state.
3. Verify transaction status directly on Paystack Dashboard using order reference.
4. If transaction is marked `success` on Paystack, manually transition order to `PAID` via order manager.

## 2. COD Discrepancy Reconciliation
If collected cash amount does not match expected order total:
1. The system automatically places the order on `ON_HOLD`.
2. Inspect `CodReconciliationLog` in Admin Dashboard.
3. Contact delivery rider and customer to reconcile variance.
4. Re-enter corrected cash amount to update order state to `DELIVERED`.
