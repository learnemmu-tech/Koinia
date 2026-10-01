/**
 * Validates post-login redirect targets (same-origin paths only).
 *
 * Rejects anything a browser could resolve to another origin: protocol-relative
 * (`//host`), backslash tricks (`/\host`, which browsers normalize to `//host`),
 * control characters / whitespace, and encoded slash or backslash at the start.
 */
export function sanitizeCallbackUrl(
  url: string | null | undefined,
  fallback = "/"
): string {
  if (!url?.trim()) return fallback;

  const trimmed = url.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  // eslint-disable-next-line no-control-regex
  if (/[\\\u0000-\u001f\u007f]/.test(trimmed)) return fallback;
  if (/^\/(%2f|%5c)/i.test(trimmed)) return fallback;

  return trimmed;
}

export function buildAuthHref(
  path: "/signin" | "/signup",
  callbackPath: string
): string {
  return `${path}?callbackUrl=${encodeURIComponent(callbackPath)}`;
}
