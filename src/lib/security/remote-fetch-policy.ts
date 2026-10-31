/**
 * Decides whether a URL may be fetched by the server.
 * Host allowlists are required. IP literals in private, loopback, and
 * link-local ranges are rejected even if a caller forgets the allowlist.
 */

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata",
  "metadata.google.internal",
]);

export type RemoteUrlDecision =
  | { ok: true; url: URL }
  | { ok: false; reason: string };

function ipv4ToParts(host: string): number[] | null {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!match) return null;
  const parts = match.slice(1).map((part) => Number(part));
  if (parts.some((part) => part > 255)) return null;
  return parts;
}

function isBlockedIpv4(parts: number[]): boolean {
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 255) return true;
  return false;
}

function isBlockedIpv6(host: string): boolean {
  const normalized = host.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true;
  if (normalized.startsWith("fe80:")) return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (normalized.startsWith("::ffff:")) {
    const mapped = normalized.slice("::ffff:".length);
    const parts = ipv4ToParts(mapped);
    if (!parts || isBlockedIpv4(parts)) return true;
  }
  return false;
}

export function evaluateRemoteFetchUrl(
  raw: string,
  allowedHosts: readonly string[]
): RemoteUrlDecision {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "invalid-url" };
  }

  if (url.protocol !== "https:") {
    return { ok: false, reason: "protocol" };
  }
  if (url.username || url.password) {
    return { ok: false, reason: "credentials" };
  }

  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host || BLOCKED_HOSTNAMES.has(host) || host.endsWith(".local")) {
    return { ok: false, reason: "hostname" };
  }

  const ipv4 = ipv4ToParts(host);
  if (ipv4 && isBlockedIpv4(ipv4)) {
    return { ok: false, reason: "private-ip" };
  }
  if (host.includes(":") && isBlockedIpv6(host)) {
    return { ok: false, reason: "private-ip" };
  }

  const allow = new Set(allowedHosts.map((item) => item.toLowerCase()));
  if (!allow.has(host)) {
    return { ok: false, reason: "host-not-allowed" };
  }

  return { ok: true, url };
}

export function evaluateRedirectTarget(
  current: URL,
  location: string | null,
  allowedHosts: readonly string[]
): RemoteUrlDecision {
  if (!location) return { ok: false, reason: "redirect" };
  let next: URL;
  try {
    next = new URL(location, current);
  } catch {
    return { ok: false, reason: "redirect" };
  }
  return evaluateRemoteFetchUrl(next.toString(), allowedHosts);
}
