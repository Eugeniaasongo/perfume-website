// Signed admin session cookie. Uses Web Crypto so it runs in both middleware (edge) and Node.

export const ADMIN_SESSION_COOKIE = "ryz_admin_session";
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12;

const encoder = new TextEncoder();

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters");
  }
  return secret;
}

function toBase64Url(bytes: ArrayBuffer): string {
  let binary = "";
  for (const b of new Uint8Array(bytes)) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return toBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(now = Date.now()): Promise<string> {
  const payload = `admin.${Math.floor(now / 1000) + ADMIN_SESSION_TTL_SECONDS}`;
  return `${payload}.${await hmac(payload)}`;
}

export async function verifySessionToken(token: string | undefined, now = Date.now()): Promise<boolean> {
  if (!token) return false;
  const lastDot = token.lastIndexOf(".");
  if (lastDot < 0) return false;

  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  const [subject, expiresAt] = payload.split(".");

  if (subject !== "admin" || !expiresAt || Number(expiresAt) * 1000 < now) return false;

  try {
    return constantTimeEqual(signature, await hmac(payload));
  } catch {
    return false;
  }
}

export async function verifyAdminPassword(candidate: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // Compare HMAC digests so length differences don't leak timing information.
  return constantTimeEqual(await hmac(`pw:${candidate}`), await hmac(`pw:${expected}`));
}
