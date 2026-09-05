export const TENANT_CONTENT_COLLECTIONS = [
  "songs",
  "sermons",
  "articles",
  "events",
  "prayerRequests",
  "donationCampaigns",
  "donations",
  "churches",
  "users",
] as const;

export type CollectionName = (typeof TENANT_CONTENT_COLLECTIONS)[number];

export function isTenantContentCollection(value: string): value is CollectionName {
  return (TENANT_CONTENT_COLLECTIONS as readonly string[]).includes(value);
}
