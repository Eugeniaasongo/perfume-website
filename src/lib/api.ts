import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(message: string, status = 400, fieldErrors?: Record<string, string>) {
  return NextResponse.json({ success: false, error: message, fieldErrors }, { status });
}

export function zodErrorResponse(error: ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    fieldErrors[key] ??= issue.message;
  }
  return jsonError(error.issues[0]?.message ?? "Invalid request", 400, fieldErrors);
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
