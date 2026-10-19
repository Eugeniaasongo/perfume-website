# RYZ Parfums

E-commerce storefront and admin portal for RYZ Parfums — Next.js 15 (App Router), Prisma + PostgreSQL, Tailwind CSS, Paystack and Cash on Delivery with SMS verification.

## Local development

Requirements: Node 20.9+, PostgreSQL 14+.

```bash
cp .env.example .env          # set DATABASE_URL, ADMIN_PASSWORD, SESSION_SECRET
npm install                   # also runs `prisma generate`
npm run db:migrate            # create tables
npm run db:seed               # sample catalog + WELCOME10 discount code
npm run dev                   # http://localhost:3000, admin at /admin
```

Without `PAYSTACK_SECRET_KEY`, online payments skip the gateway and land on the order page. Without `ARKESEL_API_KEY`, the Cash on Delivery code is shown on screen. Both fallbacks are disabled in production: a production build refuses to take payments or send codes until the keys are set.

## Checks

```bash
npm run typecheck
npm run lint
npm test        # needs DATABASE_URL; point it at a dev/test database, never production
```

## Deploying (Vercel)

1. Create a PostgreSQL database (Neon, Supabase, Vercel Postgres…).
2. Set every variable in `.env.example` in the Vercel project. Generate secrets with `openssl rand -base64 48`.
3. Deploy. The build runs `prisma migrate deploy` before `next build`. Seed once with `npm run db:seed` against the production URL, or add products from the admin portal later.
4. In the Paystack dashboard, set the webhook URL to `https://<your-domain>/api/webhooks/paystack`.
5. Vercel Cron calls `/api/cron/expire-orders` daily, which cancels unpaid online orders older than an hour and returns their stock.

See `docs/` for the architecture overview, payments specification, runbook and go-live checklist.
