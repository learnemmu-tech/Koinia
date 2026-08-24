/** Auth and membership flow paths — no imports to avoid circular deps. */

export const CREATE_WORKSPACE_PATH = "/onboarding";
export const WAITING_APPROVAL_PATH = "/waiting-approval";
export const ACCESS_DENIED_PATH = "/access-denied";
export const MEMBERSHIP_REMOVED_PATH = "/membership-removed";
export const ACCOUNT_SUSPENDED_PATH = "/account-suspended";

const JOIN_PATH_PATTERN = /^\/join\/([^/?#]+)/;
const INVITE_PATH_PATTERN = /^\/invite\/([^/?#]+)/;

export function parseJoinSlugFromPath(
  path: string | null | undefined
): string | null {
  if (!path?.trim()) return null;
  const match = path.trim().match(JOIN_PATH_PATTERN);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
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

export function isWaitingApprovalPath(pathname: string): boolean {
  return (
    pathname === WAITING_APPROVAL_PATH ||
    pathname.startsWith(`${WAITING_APPROVAL_PATH}/`)
  );
}
