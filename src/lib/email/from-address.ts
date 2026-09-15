import "server-only";

export const VERIFIED_EMAIL_DOMAIN = "futureblock.in";
const DEFAULT_FROM = "FaithConnectHub <notifications@futureblock.in>";

const EMAIL_REGEX = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

/**
 * Resend accepts:
 * - email@example.com
 * - Name <email@example.com>
 */
export function isValidResendFromAddress(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  const named = trimmed.match(/^([^<]+)<([^>]+)>$/);
  const email = (named ? named[2] : trimmed).trim();

  if ((email.match(/@/g) ?? []).length !== 1) {
    return false;
  }

  return EMAIL_REGEX.test(email);
}

export function resolveResendFromAddress(raw: string | undefined): string {
  const candidate = raw?.trim();

  if (!candidate) {
    console.warn(
      "[email] RESEND_FROM_EMAIL is empty — using default:",
      DEFAULT_FROM
    );
    return DEFAULT_FROM;
  }

  if (!isValidResendFromAddress(candidate)) {
    console.error(
      "[email] Invalid RESEND_FROM_EMAIL format:",
      JSON.stringify(candidate),
      "— expected email@example.com or Name <email@example.com>.",
      "Using default:",
      DEFAULT_FROM
    );
    return DEFAULT_FROM;
  }

  const email = candidate.match(/<([^>]+)>$/)?.[1] ?? candidate;
  const domain = email.split("@")[1]?.toLowerCase();
  if (domain !== VERIFIED_EMAIL_DOMAIN) {
    console.error(
      "[email] RESEND_FROM_EMAIL must belong to the verified domain:",
      VERIFIED_EMAIL_DOMAIN,
      "Using default sender."
    );
    return DEFAULT_FROM;
  }

  return candidate;
}

export function resolveReplyToAddress(
  raw: string | undefined,
  fallback: string
): string {
  const candidate = raw?.trim() || fallback.trim();
  if (!EMAIL_REGEX.test(candidate)) {
    console.warn(
      "[email] Invalid RESEND_REPLY_TO — using fallback:",
      fallback
    );
    return fallback;
  }
  return candidate;
}
