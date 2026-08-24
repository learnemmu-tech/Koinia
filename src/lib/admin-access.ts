import { isPlatformSuperAdmin } from "@/lib/church-access";
import {
  LEGACY_WORKSPACE_BASE,
  WORKSPACE_BASE,
  WORKSPACE_ROUTE_PREFIXES,
} from "@/lib/dashboard-routes";

/**
 * Platform super-admin email for multi-church operations (optional feature flag).
 * Church workspace access uses membership cookies — see setAuthSession.
 */
export const SUPER_ADMIN_EMAIL = "futureblock07@gmail.com";

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

/** Platform-level super admin — not the same as church workspace access. */
export function resolveIsAdmin(email: string | null | undefined): boolean {
  return isSuperAdminEmail(email);
}

/** @deprecated Use isWorkspaceRoute from @/lib/dashboard-routes */
export const ADMIN_ROUTE_PREFIXES = WORKSPACE_ROUTE_PREFIXES;

/** @deprecated Use isWorkspaceRoute from @/lib/dashboard-routes */
export function isAdminRoute(pathname: string): boolean {
  return WORKSPACE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export { WORKSPACE_BASE, LEGACY_WORKSPACE_BASE };
