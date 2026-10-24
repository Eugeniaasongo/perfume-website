// Pure shipping rules, safe to import from client components.

export const GHANA_REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Central",
  "Eastern",
  "Western",
  "Western North",
  "Volta",
  "Oti",
  "Northern",
  "Savannah",
  "North East",
  "Upper East",
  "Upper West",
  "Bono",
  "Bono East",
  "Ahafo",
] as const;

export type GhanaRegion = (typeof GHANA_REGIONS)[number];

export const FREE_SHIPPING_THRESHOLD_PESEWAS = 50000;

export function calculateShippingFeePesewas(region: string, itemsPricePesewas: number): number {
  if (itemsPricePesewas >= FREE_SHIPPING_THRESHOLD_PESEWAS) {
    return 0;
  }

  const normalizedRegion = region.trim().toLowerCase();

  if (normalizedRegion === "accra") {
    return 2000;
  } else if (normalizedRegion.includes("greater accra")) {
    return 3000;
  } else {
    return 4500;
  }
}
