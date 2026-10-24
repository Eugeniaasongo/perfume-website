// Runs before `prisma migrate deploy` on Vercel so a missing setting fails with a clear message.
const required = ["DATABASE_URL"];
const recommended = ["NEXT_PUBLIC_SITE_URL", "ADMIN_PASSWORD", "SESSION_SECRET", "PAYSTACK_SECRET_KEY", "ARKESEL_API_KEY", "CRON_SECRET", "ADMIN_ALERT_PHONE"];

const missing = required.filter((name) => !process.env[name]);
const unset = recommended.filter((name) => !process.env[name]);

if (unset.length) {
  console.warn(`⚠ Not set (some features will be unavailable): ${unset.join(", ")}`);
}

if (missing.length) {
  console.error(
    `\n✖ Missing required environment variable(s): ${missing.join(", ")}\n` +
      "  Add them in Vercel → Project → Settings → Environment Variables (for Production and Preview),\n" +
      "  then redeploy. DATABASE_URL must be a PostgreSQL connection string. See .env.example.\n"
  );
  process.exit(1);
}
