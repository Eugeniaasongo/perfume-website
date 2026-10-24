import { isProduction } from "@/lib/env";

export function isSmsConfigured(): boolean {
  return Boolean(process.env.ARKESEL_API_KEY);
}

/**
 * Sends an SMS through Arkesel. Outside production, when no API key is configured,
 * the message is logged instead so the checkout flow can be exercised locally.
 */
export async function sendSms(phoneE164: string, message: string): Promise<void> {
  const apiKey = process.env.ARKESEL_API_KEY;

  if (!apiKey) {
    if (isProduction) {
      throw new Error("SMS provider is not configured");
    }
    console.info(`[sms:dev] to=${phoneE164} message="${message}"`);
    return;
  }

  const response = await fetch("https://sms.arkesel.com/api/v2/sms/send", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: process.env.SMS_SENDER_ID || "DHA Perfumes",
      message,
      recipients: [phoneE164.replace(/^\+/, "")],
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`SMS provider responded with ${response.status}`);
  }
}
