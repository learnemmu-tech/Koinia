import { siteConfig } from "@/config/site";

export function resolveAppOrigin(origin?: string): string {
  const fromArg = origin?.trim();
  if (fromArg) return fromArg.replace(/\/$/, "");

  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin.replace(/\/$/, "");
  }

  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    siteConfig.url.replace(/\/$/, "")
  );
}

export function buildJoinChurchUrl(slug: string, origin?: string): string {
  return `${resolveAppOrigin(origin)}/join/${slug.trim().toLowerCase()}`;
}
