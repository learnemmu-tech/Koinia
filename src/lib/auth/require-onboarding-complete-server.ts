import "server-only";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import {
  CREATE_WORKSPACE_PATH,
  ORGANIZATION_SUSPENDED_PATH,
  SUPER_ADMIN_BASE,
} from "@/lib/auth/auth-paths";
import { resolveFirstTimeDestination } from "@/lib/auth/first-time-destination";
import { organizationAllowsWorkspaceAccess } from "@/lib/auth/organization-workspace-access-server";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import { MEMBER_HOME_PATH } from "@/lib/auth/membership-routing";
import { resolveUserMembershipRouting } from "@/lib/auth/membership-routing-server";
import { isWorkspaceRoute, WORKSPACE_BASE } from "@/lib/dashboard-routes";
import {
  getAppUserByClerkId,
  isOnboardingCompleted,
} from "@/lib/postgres/app-user";
import {
  userCanManageChurch,
  userCanManageOrganization,
} from "@/lib/postgres/session";

/**
 * First-time / membership gate for the church workspace layout.
 * Returns a path to leave `/dashboard`, or null to render the workspace.
 * Does not call `redirect()` — layouts must use `<ClientRedirect />`.
 */
export async function resolveDashboardLayoutDestination(): Promise<string | null> {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return `/signin?callbackUrl=${encodeURIComponent(WORKSPACE_BASE)}`;
  }

  const appUser = await getAppUserByClerkId(userId);
  if (appUser && isPlatformSuperAdmin(appUser.platformRole)) {
    return SUPER_ADMIN_BASE;
  }
  if (!appUser || !isOnboardingCompleted(appUser)) {
    return CREATE_WORKSPACE_PATH;
  }

  const allowed = await organizationAllowsWorkspaceAccess(
    appUser.organizationId,
    appUser.platformRole
  );
  if (!allowed) {
    return ORGANIZATION_SUSPENDED_PATH;
  }

  // Server-side role gate: the dashboard is for church/organization
  // administrators only. Ordinary members are sent to their member experience
  // (Heritage church site, or "/" for Signature) — they have no dashboard.
  const email =
    typeof sessionClaims?.email === "string" ? sessionClaims.email : undefined;
  const [canManageChurch, canManageOrg] = await Promise.all([
    appUser.activeChurchId
      ? userCanManageChurch(userId, email, appUser.activeChurchId)
      : Promise.resolve(false),
    appUser.organizationId
      ? userCanManageOrganization(userId, appUser.organizationId)
      : Promise.resolve(false),
  ]);
  if (!canManageChurch && !canManageOrg) {
    const routing = await resolveUserMembershipRouting(userId);
    return routing.destination === WORKSPACE_BASE ||
      isWorkspaceRoute(routing.destination)
      ? MEMBER_HOME_PATH
      : routing.destination;
  }

  const destination = await resolveFirstTimeDestination(appUser, WORKSPACE_BASE);
  return destination === WORKSPACE_BASE ? null : destination;
}

export async function requireOnboardingCompleteOrRedirect() {
  const destination = await resolveDashboardLayoutDestination();
  if (destination) redirect(destination);
}

export async function redirectIfOnboardingComplete() {
  const { userId } = await auth();
  if (!userId) return;

  const appUser = await getAppUserByClerkId(userId);
  if (appUser && isPlatformSuperAdmin(appUser.platformRole)) {
    redirect(SUPER_ADMIN_BASE);
    return;
  }
  if (!appUser || !isOnboardingCompleted(appUser)) return;

  const destination = await resolveFirstTimeDestination(appUser, WORKSPACE_BASE);
  if (destination !== WORKSPACE_BASE) redirect(destination);
  // "Ready" users: admins go to /dashboard, ordinary members to their member
  // experience. Never assume every completed user is an administrator.
  redirect((await resolveUserMembershipRouting(userId)).destination);
}
