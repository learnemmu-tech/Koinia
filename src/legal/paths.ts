/** Canonical platform legal routes. Relative paths only — never an origin. */
export const LEGAL_CENTER_PATH = "/legal";
export const LEGAL_TERMS_PATH = "/legal/terms";
export const LEGAL_PRIVACY_PATH = "/legal/privacy";

export const LEGAL_DOCUMENT_SLUGS = [
  "terms",
  "privacy",
  "cookies",
  "subscriptions",
  "donations",
  "church-agreement",
  "dpa",
  "administrator-responsibilities",
  "subprocessors",
  "community",
  "children",
  "communications",
  "security",
  "retention",
  "privacy-rights",
  "grievances",
] as const;

export type LegalDocumentSlug = (typeof LEGAL_DOCUMENT_SLUGS)[number];

/** Shown to visitors and members. Administrative agreements stay off this list. */
export const MEMBER_LEGAL_NAV = [
  { slug: "terms", label: "Terms of Service" },
  { slug: "privacy", label: "Privacy Policy" },
  { slug: "community", label: "Community Guidelines" },
  { slug: "cookies", label: "Cookie Policy" },
] as const;

/** Extra agreements for church owners and administrators. Not a new role system. */
export const CHURCH_ADMIN_LEGAL_NAV = [
  { slug: "church-agreement", label: "Church Agreement" },
  { slug: "subscriptions", label: "Subscriptions" },
  { slug: "dpa", label: "Data Processing" },
  { slug: "donations", label: "Donations" },
] as const;

export function legalDocumentPath(slug: string): string {
  return `/legal/${slug}`;
}

export function isLegalDocumentSlug(value: string): value is LegalDocumentSlug {
  return (LEGAL_DOCUMENT_SLUGS as readonly string[]).includes(value);
}
