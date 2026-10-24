"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
  createSessionToken,
  verifyAdminPassword,
} from "@/lib/auth/session";

const attempts = new Map<string, { count: number; resetAt: number }>();

export async function loginAction(_prev: { error?: string } | undefined, formData: FormData) {
  if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
    return { error: "Admin access is not configured. Set ADMIN_PASSWORD and SESSION_SECRET." };
  }

  // Best-effort throttle per server instance; pair with a strong password.
  const now = Date.now();
  const bucket = attempts.get("admin");
  if (bucket && bucket.resetAt > now && bucket.count >= 10) {
    return { error: "Too many attempts. Please wait a few minutes." };
  }

  const password = String(formData.get("password") ?? "");
  if (!(await verifyAdminPassword(password))) {
    attempts.set("admin", {
      count: bucket && bucket.resetAt > now ? bucket.count + 1 : 1,
      resetAt: bucket && bucket.resetAt > now ? bucket.resetAt : now + 10 * 60 * 1000,
    });
    return { error: "Incorrect password" };
  }
  attempts.delete("admin");

  (await cookies()).set(ADMIN_SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });

  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutAction() {
  (await cookies()).delete(ADMIN_SESSION_COOKIE);
  redirect("/admin/login");
}
