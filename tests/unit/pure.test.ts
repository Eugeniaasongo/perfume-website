import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateShippingFeePesewas } from "@/lib/shipping";
import { normalizeGhanaPhone, maskPhone } from "@/lib/phone";
import { formatGhs, splitNotes } from "@/lib/format";
import { canTransition } from "@/lib/orders/state-machine";
import { createSessionToken, verifySessionToken, ADMIN_SESSION_TTL_SECONDS } from "@/lib/auth/session";
import { checkoutSchema } from "@/lib/orders/checkout";

process.env.SESSION_SECRET ??= "test-session-secret-that-is-long-enough";

test("shipping fees by region and free threshold", () => {
  assert.equal(calculateShippingFeePesewas("Accra", 29900), 2000);
  assert.equal(calculateShippingFeePesewas("Greater Accra", 29900), 3000);
  assert.equal(calculateShippingFeePesewas("Ashanti", 29900), 4500);
  assert.equal(calculateShippingFeePesewas("Ashanti", 50000), 0);
});

test("normalizes Ghana phone numbers", () => {
  assert.equal(normalizeGhanaPhone("024 123 4567"), "+233241234567");
  assert.equal(normalizeGhanaPhone("+233 24 123 4567"), "+233241234567");
  assert.equal(normalizeGhanaPhone("233241234567"), "+233241234567");
  assert.equal(normalizeGhanaPhone("0201234567"), "+233201234567");
  assert.equal(normalizeGhanaPhone("12345"), null);
  assert.equal(normalizeGhanaPhone("0841234567"), null);
  assert.equal(maskPhone("+233241234567"), "+233 24 *** 4567");
});

test("formats money and notes", () => {
  assert.equal(formatGhs(29900), "GHS 299.00");
  assert.equal(formatGhs(123456), "GHS 1,234.56");
  assert.deepEqual(splitNotes(" Oud, Rose ,, Musk"), ["Oud", "Rose", "Musk"]);
});

test("order state machine rules", () => {
  assert.ok(canTransition("PENDING_PAYMENT", "PAID"));
  assert.ok(!canTransition("CANCELLED", "PAID"));
  assert.ok(!canTransition("DELIVERED", "PENDING_PAYMENT"));
});

test("admin session tokens are signed and expire", async () => {
  const token = await createSessionToken();
  assert.ok(await verifySessionToken(token));
  assert.ok(!(await verifySessionToken(token.replace(/.$/, (c) => (c === "A" ? "B" : "A")))));
  assert.ok(!(await verifySessionToken(token.replace("admin.", "admin.9"))));
  assert.ok(!(await verifySessionToken(token, Date.now() + (ADMIN_SESSION_TTL_SECONDS + 1) * 1000)));
  assert.ok(!(await verifySessionToken(undefined)));
});

test("checkout validation", () => {
  const base = {
    customerName: "Kofi Mensah",
    customerPhone: "024 123 4567",
    region: "Greater Accra",
    city: "East Legon",
    addressLine: "12 Palm Street",
    items: [{ variantId: "v1", quantity: 1 }],
  };

  const cod = checkoutSchema.safeParse({ ...base, paymentProvider: "CASH_ON_DELIVERY", otp: "123456" });
  assert.ok(cod.success);
  assert.equal(cod.data.customerPhone, "+233241234567");

  const codNoOtp = checkoutSchema.safeParse({ ...base, paymentProvider: "CASH_ON_DELIVERY" });
  assert.ok(!codNoOtp.success);

  const paystackNoEmail = checkoutSchema.safeParse({ ...base, paymentProvider: "PAYSTACK" });
  assert.ok(!paystackNoEmail.success);

  const badQty = checkoutSchema.safeParse({
    ...base,
    paymentProvider: "PAYSTACK",
    customerEmail: "kofi@example.com",
    items: [{ variantId: "v1", quantity: 0 }],
  });
  assert.ok(!badQty.success);

  const badRegion = checkoutSchema.safeParse({ ...base, region: "Atlantis", paymentProvider: "CASH_ON_DELIVERY", otp: "1" });
  assert.ok(!badRegion.success);
});
