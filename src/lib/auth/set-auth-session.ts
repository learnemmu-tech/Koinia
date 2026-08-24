import type { FirestoreUser } from "@/lib/firebase-auth-service";
import type { FirebaseMembership } from "@/types/membership";

import {
  AUTH_ADMIN_COOKIE_NAME,
  AUTH_COOKIE_NAME,
  AUTH_ONBOARDING_COMPLETE_COOKIE_NAME,
  AUTH_ROLE_COOKIE_NAME,
} from "@/lib/auth-cookies";

import { getSessionCookieHints, type WorkspaceAccessInput } from "./workspace-access";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function writeCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export type AuthSessionOptions = {
  role?: string;
  profile?: FirestoreUser | null;
  membership?: FirebaseMembership | null;
  churchesCount?: number;
  workspaceType?: WorkspaceAccessInput["workspaceType"];
  /** @deprecated */
  isAdmin?: boolean;
};

/**
 * Syncs client auth cookies for middleware hints only.
 * Firestore (profile + membership) remains the source of truth — guards enforce access client-side.
 */
export function setAuthSession(
  authenticated: boolean,
  options?: AuthSessionOptions
) {
  if (!authenticated) {
    clearCookie(AUTH_COOKIE_NAME);
    clearCookie(AUTH_ROLE_COOKIE_NAME);
    clearCookie(AUTH_ADMIN_COOKIE_NAME);
    clearCookie(AUTH_ONBOARDING_COMPLETE_COOKIE_NAME);
    return;
  }

  writeCookie(AUTH_COOKIE_NAME, "1", COOKIE_MAX_AGE);

  if (options?.role) {
    writeCookie(AUTH_ROLE_COOKIE_NAME, options.role, COOKIE_MAX_AGE);
  }

  const input: WorkspaceAccessInput = {
    profile: options?.profile ?? null,
    membership: options?.membership ?? null,
    churchesCount: options?.churchesCount ?? 0,
    workspaceType: options?.workspaceType,
  };

  const hints = getSessionCookieHints(input);

  if (hints.workspaceAccess || options?.isAdmin) {
    writeCookie(AUTH_ADMIN_COOKIE_NAME, "1", COOKIE_MAX_AGE);
  } else {
    clearCookie(AUTH_ADMIN_COOKIE_NAME);
  }

  if (hints.onboardingComplete) {
    writeCookie(AUTH_ONBOARDING_COMPLETE_COOKIE_NAME, "1", COOKIE_MAX_AGE);
  } else {
    clearCookie(AUTH_ONBOARDING_COMPLETE_COOKIE_NAME);
  }
}
