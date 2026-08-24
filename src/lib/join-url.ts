import { siteConfig } from "@/config/site";

export function buildJoinChurchUrl(slug: string): string {
  const base =
    (typeof window !== "undefined" ? window.location.origin : null) ??
    process.env.NEXT_PUBLIC_APP_URL ??
    siteConfig.url;
  return `${base.replace(/\/$/, "")}/join/${slug.trim().toLowerCase()}`;
}
