#!/usr/bin/env sh
# Vercel build: verify settings, apply database migrations, optionally load the sample catalog, then build.
set -e

node scripts/check-env.mjs
npx prisma migrate deploy

# Opt-in: set SEED_SAMPLE_DATA=true to add the sample perfumes. The seed only creates
# missing records, so it never overwrites prices or stock edited in the admin portal.
if [ "$SEED_SAMPLE_DATA" = "true" ]; then
  npx prisma db seed
fi

npx next build
