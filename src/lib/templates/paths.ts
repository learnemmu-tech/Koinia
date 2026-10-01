import { resolveAppOrigin } from "@/lib/join-url";

export function churchWebsitePath(slug: string, subpath = ""): string {
  const normalized = slug.trim().toLowerCase();
  const base = `/c/${encodeURIComponent(normalized)}`;
  if (!subpath || subpath === "/") return base;
  return `${base}${subpath.startsWith("/") ? subpath : `/${subpath}`}`;
}

/**
 * Legacy `/groups` on a church site maps to Ministries. Returns the destination
 * pathname, or null when the path is not a church groups URL.
 */
export function churchGroupsRedirectPath(
  pathname: string | null | undefined
): string | null {
  const value = pathname?.trim() ?? "";
  const match = value.match(/^\/c\/([^/]+)\/groups\/?$/i);
  if (!match?.[1]) return null;
  let slug = match[1];
  try {
    slug = decodeURIComponent(slug);
  } catch {
    return null;
  }
  const normalized = slug.trim().toLowerCase();
  if (!normalized || normalized.includes("/") || normalized.includes("\\")) {
    return null;
  }
  return churchWebsitePath(normalized, "/ministries");
}

/** Relative public church URL. Never includes origin or a localhost port. */
export function buildChurchPublicUrl(slug: string, path = ""): string {
  return churchWebsitePath(slug, path);
}

/** Public canonical for a church site. Stored localhost origins are ignored. */
export function churchCanonicalPath(
  slug: string,
  storedCanonical?: string | null
): string {
  const value = storedCanonical?.trim() ?? "";
  if (value && !/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(value)) {
    return value;
  }
  return churchWebsitePath(slug);
}

export function buildChurchWebsiteUrl(slug: string, origin?: string): string {
  return `${resolveAppOrigin(origin)}${churchWebsitePath(slug)}`;
}

export function isChurchWebsitePath(pathname: string | null | undefined): boolean {
  if (!pathname?.trim()) return false;
  return pathname === "/c" || pathname.startsWith("/c/");
}

export function isWebsitePreviewPath(pathname: string | null | undefined): boolean {
  if (!pathname?.trim()) return false;
  return (
    pathname === "/preview/website" || pathname.startsWith("/preview/website/")
  );
}

export function websitePreviewPath(
  templateId: string,
  options: { mode: "demo" | "live"; slug?: string }
): string {
  const params = new URLSearchParams({ mode: options.mode });
  if (options.slug) params.set("slug", options.slug);
  return `/preview/website/${encodeURIComponent(templateId)}?${params.toString()}`;
}
