import {
  WEBSITE_VISIBILITY_KEYS,
  type WebsiteVisibility,
  type WebsiteVisibilityKey,
} from "@/lib/templates/types";

export const DEFAULT_WEBSITE_VISIBILITY: WebsiteVisibility = {
  about: true,
  sermons: true,
  events: true,
  ministries: true,
  articles: true,
  videos: true,
  giving: true,
  contact: true,
};

export function parseWebsiteVisibility(
  input: unknown,
  fallback: Partial<WebsiteVisibility> = {}
): WebsiteVisibility {
  const source =
    input && typeof input === "object" && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};

  const visibility = { ...DEFAULT_WEBSITE_VISIBILITY, ...fallback };
  for (const key of WEBSITE_VISIBILITY_KEYS) {
    const value = source[key];
    if (typeof value === "boolean") visibility[key] = value;
  }
  return visibility;
}

export function isSectionVisible(
  visibility: WebsiteVisibility,
  key: WebsiteVisibilityKey
): boolean {
  return visibility[key] !== false;
}
