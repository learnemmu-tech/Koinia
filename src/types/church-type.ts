export const CHURCH_TYPES = [
  "independent",
  "multi_site",
  "ministry",
  "non_profit",
] as const;

export type ChurchType = (typeof CHURCH_TYPES)[number];

export const CHURCH_TYPE_LABELS: Record<ChurchType, string> = {
  independent: "Independent Church",
  multi_site: "Multi-site Church",
  ministry: "Ministry",
  non_profit: "Non-profit",
};

export function isChurchType(value: string): value is ChurchType {
  return (CHURCH_TYPES as readonly string[]).includes(value);
}
