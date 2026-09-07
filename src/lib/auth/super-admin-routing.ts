import { sanitizeCallbackUrl } from "@/lib/callback-url";
import { isWorkspaceRoute } from "@/lib/dashboard-routes";

import {
  ACCESS_DENIED_PATH,
  ACCOUNT_SUSPENDED_PATH,
  CREATE_WORKSPACE_PATH,
  isInvitePath,
  isJoinPath,
  isMembershipStatusPath,
  isOnboardingPath,
  isSuperAdminPath,
  MEMBERSHIP_REMOVED_PATH,
  ORGANIZATION_SUSPENDED_PATH,
  POST_AUTH_CONTINUE_PATH,
  SUPER_ADMIN_BASE,
  WAITING_APPROVAL_PATH,
} from "./auth-paths";

function stripAuthCallbackNoise(path: string): string {
  let sanitized = path;
  if (
    sanitized === "/signin" ||
    sanitized.startsWith("/signin/") ||
    sanitized === "/signup" ||
    sanitized.startsWith("/signup/") ||
    sanitized === "/sso-callback" ||
    sanitized.startsWith("/sso-callback/") ||
    sanitized === "/forgot-password" ||
    sanitized.startsWith("/forgot-password/") ||
    sanitized === POST_AUTH_CONTINUE_PATH ||
    sanitized.startsWith(`${POST_AUTH_CONTINUE_PATH}/`)
  ) {
    sanitized = "";
  }
  return sanitized;
}

/** Callback targets that must never override SuperAdmin console entry. */
export function isNormalWorkspaceEntryCallback(path: string): boolean {
  const sanitized = stripAuthCallbackNoise(
    path ? sanitizeCallbackUrl(path, "") : ""
  );
  if (!sanitized || sanitized === "/") return true;
  if (isWorkspaceRoute(sanitized)) return true;
  if (isOnboardingPath(sanitized)) return true;
  if (isJoinPath(sanitized)) return true;
  if (isInvitePath(sanitized)) return true;
  if (isMembershipStatusPath(sanitized)) return true;
  if (
    sanitized === WAITING_APPROVAL_PATH ||
    sanitized.startsWith(`${WAITING_APPROVAL_PATH}/`) ||
    sanitized === ACCESS_DENIED_PATH ||
    sanitized === ACCOUNT_SUSPENDED_PATH ||
    sanitized === MEMBERSHIP_REMOVED_PATH ||
    sanitized === ORGANIZATION_SUSPENDED_PATH ||
    sanitized === CREATE_WORKSPACE_PATH ||
    sanitized.startsWith(`${CREATE_WORKSPACE_PATH}/`)
  ) {
    return true;
  }
  return false;
}

/**
 * SuperAdmin post-auth destination.
 * Only explicit /super-admin paths are honored; normal workspace callbacks lose.
 */
export function resolveSuperAdminPostAuthDestination(
  callbackUrl?: string | null
): string {
  const sanitized = stripAuthCallbackNoise(
    callbackUrl ? sanitizeCallbackUrl(callbackUrl, "") : ""
  );

  if (sanitized && isSuperAdminPath(sanitized)) {
    return sanitized;
  }

  return SUPER_ADMIN_BASE;
}

/** Authenticated SuperAdmin should not remain on normal workspace entry routes. */
export function shouldRedirectAuthenticatedSuperAdminFromPath(
  pathname: string
): boolean {
  if (isSuperAdminPath(pathname)) return false;
  if (pathname === "/") return true;
  if (isWorkspaceRoute(pathname)) return true;
  if (isOnboardingPath(pathname)) return true;
  if (
    pathname === WAITING_APPROVAL_PATH ||
    pathname.startsWith(`${WAITING_APPROVAL_PATH}/`)
  ) {
    return true;
  }
  return false;
}
