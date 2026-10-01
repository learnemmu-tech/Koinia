import { siteConfig } from "@/config/site";

function vercelDeploymentOrigin(): string | null {
  const host = process.env.VERCEL_URL?.trim();
  if (!host) return null;
  return `https://${host.replace(/^https?:\/\//, "")}`.replace(/\/$/, "");
}

/**
 * Canonical public origin for emails, invites, and payment return URLs.
 * Never returns localhost in production.
 */
export function resolveAppOrigin(origin?: string): string {
  const fromArg = origin?.trim();
  if (fromArg) return fromArg.replace(/\/$/, "");

  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin.replace(/\/$/, "");
  }

  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const vercel = vercelDeploymentOrigin();
  if (vercel) return vercel;

  if (process.env.NODE_ENV === "production") {
    return siteConfig.url.replace(/\/$/, "");
  }

  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function buildJoinChurchUrl(slug: string, origin?: string): string {
  return `${resolveAppOrigin(origin)}/join/${slug.trim().toLowerCase()}`;
}
