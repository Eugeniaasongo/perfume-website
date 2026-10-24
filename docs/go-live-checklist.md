# RYZ Parfums Go-Live Checklist

## Configuration
- [ ] Production PostgreSQL provisioned; `DATABASE_URL` set
- [ ] `NEXT_PUBLIC_SITE_URL` set to the live domain
- [ ] Strong `ADMIN_PASSWORD` and random `SESSION_SECRET` (32+ chars)
- [ ] `PAYSTACK_SECRET_KEY` (live key) set; webhook URL registered in Paystack
- [ ] `ARKESEL_API_KEY` and an approved `SMS_SENDER_ID` set (Cash on Delivery is unavailable without them)
- [ ] `CRON_SECRET` set
- [ ] `ADMIN_ALERT_PHONE` set to the number that should hear about new orders
- [ ] Paystack account allowed to issue refunds (Settings → Preferences in the Paystack dashboard)
- [ ] Real support phone, email and WhatsApp numbers set (`NEXT_PUBLIC_SUPPORT_*`, `NEXT_PUBLIC_WHATSAPP_NUMBER`)
- [ ] Product prices and stock reviewed in `/admin/products`; seed/test discount codes removed or adjusted

## Verified in code
- [x] Money stored and computed in integer pesewas; totals always recomputed on the server
- [x] Atomic stock reservation; stock returned on cancellation, failed payment and returns
- [x] Paystack webhook HMAC (constant-time), idempotent ledger, amount check
- [x] Phone OTP: hashed, 10-minute expiry, single use, 5 attempts, resend throttling
- [x] Admin portal and admin APIs require a signed session
- [x] Order lookups require the matching phone number
- [x] "Inspired by" labels can be switched off globally at runtime from `/admin/settings`

## Legal
- [ ] Trademark review of comparative "Inspired by" wording
- [ ] Only proprietary RYZ photography uploaded
- [ ] Privacy notice reviewed against the Data Protection Act, 2012 (Act 843)
