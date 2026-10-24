const ghsFormatter = new Intl.NumberFormat("en-GH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats integer pesewas as a GHS display string, e.g. 29900 -> "GHS 299.00". */
export function formatGhs(pesewas: number): string {
  return `GHS ${ghsFormatter.format(pesewas / 100)}`;
}

export function splitNotes(notes: string | null | undefined): string[] {
  if (!notes) return [];
  return notes
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);
}
