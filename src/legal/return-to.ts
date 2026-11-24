/** Keep legal navigation on this site. Rejects external and protocol-relative targets. */
export function safeLegalReturnTo(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  if ([...trimmed].some((char) => char === "\\" || char.charCodeAt(0) <= 31 || char.charCodeAt(0) === 127)) return null;
  if (/^\/(%2f|%5c)/i.test(trimmed)) return null;
  return trimmed;
}

export function legalHref(path: string, returnTo: string | null | undefined): string {
  const safe = safeLegalReturnTo(returnTo);
  if (!safe) return path;
  const joiner = path.includes("?") ? "&" : "?";
  return `${path}${joiner}returnTo=${encodeURIComponent(safe)}`;
}

export function legalReturnLabel(returnTo: string | null | undefined): string | null {
  const safe = safeLegalReturnTo(returnTo);
  if (!safe) return null;
  const path = safe.split("?")[0] ?? safe;
  if (path === "/signin" || /\/(login|sign-in)$/.test(path)) return "Back to Sign In";
  if (path === "/signup" || /\/(signup|sign-up)$/.test(path)) return "Back to Create Account";
  return "Back to Website";
}
