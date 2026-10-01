import {
  SOCIAL_PLATFORMS,
  type SocialPlatform,
  type WebsiteSocialLinks,
} from "@/lib/templates/types";

const PLATFORM_HOSTS: Record<SocialPlatform, string[]> = {
  instagram: ["instagram.com", "www.instagram.com"],
  facebook: ["facebook.com", "www.facebook.com", "fb.com", "www.fb.com"],
  youtube: ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"],
  tiktok: ["tiktok.com", "www.tiktok.com"],
  x: ["x.com", "www.x.com", "twitter.com", "www.twitter.com"],
};

export function validateSocialUrl(
  platform: SocialPlatform,
  raw: string | null | undefined
): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return undefined;
  }

  if (parsed.protocol !== "https:") return undefined;

  const host = parsed.hostname.toLowerCase();
  if (!PLATFORM_HOSTS[platform].includes(host)) return undefined;

  return parsed.toString();
}

export function parseSocialLinks(input: unknown): WebsiteSocialLinks {
  const source =
    input && typeof input === "object" && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};

  const links: WebsiteSocialLinks = {};
  for (const platform of SOCIAL_PLATFORMS) {
    const value = source[platform];
    if (typeof value !== "string") continue;
    const valid = validateSocialUrl(platform, value);
    if (valid) links[platform] = valid;
  }
  return links;
}

export function configuredSocialLinks(
  links: WebsiteSocialLinks
): Array<{ platform: SocialPlatform; url: string }> {
  return SOCIAL_PLATFORMS.flatMap((platform) => {
    const url = links[platform];
    return url ? [{ platform, url }] : [];
  });
}
