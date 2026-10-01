/** Auth and membership flow paths — no imports to avoid circular deps. */

export const CREATE_WORKSPACE_PATH = "/onboarding";
export const ONBOARDING_WEBSITE_PATH = "/onboarding/website";
export const ONBOARDING_SUCCESS_PATH = "/onboarding/success";
export const POST_AUTH_CONTINUE_PATH = "/auth/continue";
/** Safe SSO/Clerk fallback when redirectUrlComplete is dropped — preserves callbackUrl. */
export const POST_AUTH_CONTINUE_HOME =
  `${POST_AUTH_CONTINUE_PATH}?callbackUrl=${encodeURIComponent("/")}` as const;
export const WAITING_APPROVAL_PATH = "/waiting-approval";
export const ACCESS_DENIED_PATH = "/access-denied";
export const MEMBERSHIP_REMOVED_PATH = "/membership-removed";
export const ACCOUNT_SUSPENDED_PATH = "/account-suspended";
export const ORGANIZATION_SUSPENDED_PATH = "/organization-suspended";
export const SUPER_ADMIN_BASE = "/super-admin";

const JOIN_PATH_PATTERN = /^\/join\/([^/?#]+)/;
const INVITE_PATH_PATTERN = /^\/invite\/([^/?#]+)/;

export function parseJoinSlugFromPath(
  path: string | null | undefined
): string | null {
  if (!path?.trim()) return null;
  const match = path.trim().match(JOIN_PATH_PATTERN);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function pathnameOnly(path: string): string {
  const trimmed = path.trim();
  const withoutQuery = trimmed.split("?")[0] ?? trimmed;
  return withoutQuery.replace(/\/+$/, "") || "/";
}

export function parseChurchWebsiteSlugFromPath(
  path: string | null | undefined
): string | null {
  if (!path?.trim()) return null;
  const match = pathnameOnly(path).match(/^\/c\/([^/]+)/);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export function isChurchWebsiteAuthPath(
  path: string | null | undefined
): boolean {
  if (!path?.trim()) return false;
  return /\/c\/[^/]+\/(login|signup|forgot-password)$/.test(pathnameOnly(path));
}

export function isJoinPath(path: string | null | undefined): boolean {
  return parseJoinSlugFromPath(path) !== null;
}

export function joinPathForSlug(slug: string): string {
  return `/join/${encodeURIComponent(slug.trim())}`;
}

export function parseInviteTokenFromPath(
  path: string | null | undefined
): string | null {
  if (!path?.trim()) return null;
  const match = path.trim().match(INVITE_PATH_PATTERN);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function isInvitePath(path: string | null | undefined): boolean {
  return parseInviteTokenFromPath(path) !== null;
}

export function isPostAuthContinuePath(path: string | null | undefined): boolean {
  if (!path?.trim()) return false;
  const trimmed = path.trim();
  return (
    trimmed === POST_AUTH_CONTINUE_PATH ||
    trimmed.startsWith(`${POST_AUTH_CONTINUE_PATH}/`) ||
    trimmed.startsWith(`${POST_AUTH_CONTINUE_PATH}?`)
  );
}

export function postAuthContinueHref(callbackUrl: string): string {
  const path = callbackUrl.trim() || "/";
  if (isPostAuthContinuePath(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${POST_AUTH_CONTINUE_PATH}?callbackUrl=${encodeURIComponent(normalized)}`;
}

export function invitePathForToken(token: string): string {
  return `/invite/${encodeURIComponent(token.trim())}`;
}

export function isCreateWorkspacePath(
  path: string | null | undefined,
  normalize: (url: string | null | undefined, fallback?: string) => string
): boolean {
  if (!path?.trim()) return false;
  const normalized = normalize(path, "");
  return (
    normalized === CREATE_WORKSPACE_PATH ||
    normalized.startsWith(`${CREATE_WORKSPACE_PATH}/`)
  );
}

export function buildCreateWorkspaceAuthHref(
  path: "/signin" | "/signup" = "/signup"
): string {
  return `${path}?callbackUrl=${encodeURIComponent(CREATE_WORKSPACE_PATH)}`;
}

export function buildJoinAuthHref(
  slug: string,
  path: "/signin" | "/signup" = "/signin"
): string {
  return `${path}?callbackUrl=${encodeURIComponent(joinPathForSlug(slug))}`;
}

export function buildInviteAuthHref(
  token: string,
  path: "/signin" | "/signup" = "/signin"
): string {
  return `${path}?callbackUrl=${encodeURIComponent(invitePathForToken(token))}`;
}

export function isOnboardingPath(pathname: string): boolean {
  return (
    pathname === CREATE_WORKSPACE_PATH ||
    pathname.startsWith(`${CREATE_WORKSPACE_PATH}/`)
  );
}

export function isOnboardingFormPath(pathname: string): boolean {
  return pathname === CREATE_WORKSPACE_PATH;
}

export function isOnboardingWebsitePath(pathname: string): boolean {
  return (
    pathname === ONBOARDING_WEBSITE_PATH ||
    pathname.startsWith(`${ONBOARDING_WEBSITE_PATH}/`)
  );
}

export function isOnboardingSuccessPath(pathname: string): boolean {
  return (
    pathname === ONBOARDING_SUCCESS_PATH ||
    pathname.startsWith(`${ONBOARDING_SUCCESS_PATH}/`)
  );
}

export function isWaitingApprovalPath(pathname: string): boolean {
  return (
    pathname === WAITING_APPROVAL_PATH ||
    pathname.startsWith(`${WAITING_APPROVAL_PATH}/`)
  );
}

export function isSuperAdminPath(pathname: string): boolean {
  return (
    pathname === SUPER_ADMIN_BASE ||
    pathname.startsWith(`${SUPER_ADMIN_BASE}/`)
  );
}

export function isMembershipStatusPath(pathname: string): boolean {
  return (
    isWaitingApprovalPath(pathname) ||
    pathname === ACCESS_DENIED_PATH ||
    pathname === MEMBERSHIP_REMOVED_PATH ||
    pathname === ACCOUNT_SUSPENDED_PATH ||
    pathname === ORGANIZATION_SUSPENDED_PATH
  );
}
