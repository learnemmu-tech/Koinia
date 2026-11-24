export type CookieCategory = "necessary" | "preferences" | "analytics" | "externalMedia";

export type CookieInventoryItem = {
  name: string;
  provider: string;
  purpose: string;
  category: CookieCategory;
  duration: string;
  consentRequired: boolean;
};

/** Only technologies confirmed in this repository. Durations are the ones the code sets. */
export const COOKIE_INVENTORY: CookieInventoryItem[] = [
  {
    name: "koinia_consent",
    provider: "Koinia",
    purpose: "Stores the visitor's cookie choices and a pseudonymous consent id for this browser on this host.",
    category: "necessary",
    duration: "180 days",
    consentRequired: false,
  },
  {
    name: "__session and related Clerk cookies",
    provider: "Clerk",
    purpose: "Keeps the signed-in session. Names and expiry are set by Clerk, not by Koinia application code.",
    category: "necessary",
    duration: "Set by Clerk",
    consentRequired: false,
  },
  {
    name: "fch_active_church_id",
    provider: "Koinia",
    purpose: "Remembers the church workspace the person selected. The server membership record remains authoritative.",
    category: "necessary",
    duration: "1 year",
    consentRequired: false,
  },
  {
    name: "fc_join_slug",
    provider: "Koinia",
    purpose: "Short-lived hint for the church join flow the visitor started.",
    category: "necessary",
    duration: "45 minutes",
    consentRequired: false,
  },
  {
    name: "NEXT_LOCALE",
    provider: "Koinia",
    purpose: "Stores the language the visitor selected.",
    category: "preferences",
    duration: "1 year",
    consentRequired: false,
  },
  {
    name: "sidebar_state",
    provider: "Koinia",
    purpose: "Remembers whether the signed-in sidebar is open.",
    category: "preferences",
    duration: "Set by the sidebar component",
    consentRequired: true,
  },
  {
    name: "Vercel Analytics",
    provider: "Vercel",
    purpose: "Product analytics loaded from the root layout. Exact cookie names are chosen by the Vercel script.",
    category: "analytics",
    duration: "Set by Vercel",
    consentRequired: true,
  },
  {
    name: "Umami script",
    provider: "Umami (us.umami.is)",
    purpose: "Analytics script loaded when UMAMI_WEBSITE_ID is configured.",
    category: "analytics",
    duration: "Set by Umami",
    consentRequired: true,
  },
  {
    name: "YouTube embed",
    provider: "YouTube",
    purpose: "Church videos can open a YouTube iframe. The iframe is not loaded until the viewer allows that embed.",
    category: "externalMedia",
    duration: "Set by YouTube if the embed loads",
    consentRequired: true,
  },
];

export const CONFIGURED_OPTIONAL: CookieCategory[] = ["preferences", "analytics", "externalMedia"];
