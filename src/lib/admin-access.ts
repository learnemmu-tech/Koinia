import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import {
  LEGACY_WORKSPACE_BASE,
  WORKSPACE_BASE,
  WORKSPACE_ROUTE_PREFIXES,
} from "@/lib/dashboard-routes";

export { isPlatformSuperAdmin };

/** @deprecated Use isWorkspaceRoute from @/lib/dashboard-routes */
export const ADMIN_ROUTE_PREFIXES = WORKSPACE_ROUTE_PREFIXES;

/** @deprecated Use isWorkspaceRoute from @/lib/dashboard-routes */
export function isAdminRoute(pathname: string): boolean {
  return WORKSPACE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export { WORKSPACE_BASE, LEGACY_WORKSPACE_BASE };
