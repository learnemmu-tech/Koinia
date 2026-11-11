import { resolveAppOrigin } from "@/lib/join-url";

/** Keep `/c/[slug]` on the sign-in callback. Other routes stay on `/signin`. */
export function signInPathPreservingChurch(
  pathname: string | null | undefined
): string {
  const value = pathname?.split(/[?#]/)[0] ?? "";
  if (/^\/c\/[^/]+/.test(value)) {
    return `/signin?callbackUrl=${encodeURIComponent(value)}`;
  }
  return "/signin";
}

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

const CHURCH_PUBLIC_HREF_ALIASES: Record<string, string> = {
  "/donations": "/give",
  "/prayer-requests": "/prayer",
  "/groups": "/ministries",
};

const CHURCH_PUBLIC_ROOTS = [
  "/",
  "/songs",
  "/sermons",
  "/articles",
  "/videos",
  "/shorts",
  "/events",
  "/books",
  "/community",
  "/give",
  "/prayer",
  "/shepherd",
  "/ministries",
  "/about",
  "/contact",
];

function isChurchPublicPath(path: string): boolean {
  return CHURCH_PUBLIC_ROOTS.some(
    (root) => path === root || (root !== "/" && path.startsWith(`${root}/`))
  );
}

/** Prefix a public app path with `/c/[slug]` when that church route already exists. */
export function churchScopedPublicHref(slug: string, href: string): string {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!normalizedSlug || !href.startsWith("/") || href.startsWith("/c/")) return href;
  const hashIndex = href.indexOf("#");
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const queryIndex = withoutHash.indexOf("?");
  const query = queryIndex >= 0 ? withoutHash.slice(queryIndex) : "";
  const path = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const mapped = CHURCH_PUBLIC_HREF_ALIASES[path] ?? path;
  if (!isChurchPublicPath(mapped)) return href;
  return `${churchWebsitePath(normalizedSlug, mapped === "/" ? "" : mapped)}${query}${hash}`;
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
