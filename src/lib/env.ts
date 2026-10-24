export const isProduction = process.env.NODE_ENV === "production";

export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!url) {
    if (isProduction) {
      throw new Error("NEXT_PUBLIC_SITE_URL must be set in production");
    }
    return "http://localhost:3000";
  }
  return (url.startsWith("http") ? url : `https://${url}`).replace(/\/$/, "");
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}
