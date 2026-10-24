/**
 * Normalizes a Ghanaian mobile number to E.164 (+233XXXXXXXXX).
 * Accepts "024 123 4567", "0241234567", "233241234567" and "+233 24 123 4567".
 * Returns null when the input is not a valid Ghana mobile number.
 */
export function normalizeGhanaPhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");
  let national: string;

  if (digits.startsWith("+233")) {
    national = digits.slice(4);
  } else if (digits.startsWith("233")) {
    national = digits.slice(3);
  } else if (digits.startsWith("0")) {
    national = digits.slice(1);
  } else {
    national = digits;
  }

  if (!/^[235]\d{8}$/.test(national)) {
    return null;
  }

  return `+233${national}`;
}

/** "+233241234567" -> "+233 24 *** 4567" */
export function maskPhone(phone: string): string {
  const normalized = normalizeGhanaPhone(phone) ?? phone;
  if (normalized.length < 8) return normalized;
  return `${normalized.slice(0, 4)} ${normalized.slice(4, 6)} *** ${normalized.slice(-4)}`;
}
