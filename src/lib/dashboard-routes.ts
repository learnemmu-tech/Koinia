/** Primary church workspace route (formerly /admin-worship-panel). */
export const WORKSPACE_BASE = "/dashboard";

export const LEGACY_WORKSPACE_BASE = "/admin-worship-panel";

export const WORKSPACE_ROUTE_PREFIXES = [
  WORKSPACE_BASE,
  LEGACY_WORKSPACE_BASE,
  "/admin-panel",
  "/admin",
] as const;

export function isWorkspaceRoute(pathname: string): boolean {
  return WORKSPACE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function workspacePath(subpath = ""): string {
  const normalized = subpath.startsWith("/") ? subpath : `/${subpath}`;
  if (normalized === "/") return WORKSPACE_BASE;
  return `${WORKSPACE_BASE}${normalized}`;
}
