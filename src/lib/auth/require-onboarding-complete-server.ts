import "server-only";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { CREATE_WORKSPACE_PATH, ORGANIZATION_SUSPENDED_PATH, SUPER_ADMIN_BASE } from "@/lib/auth/auth-paths";
import { organizationAllowsWorkspaceAccess } from "@/lib/auth/organization-workspace-access-server";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import { WORKSPACE_BASE } from "@/lib/dashboard-routes";
import {
  getAppUserByClerkId,
  isOnboardingCompleted,
} from "@/lib/postgres/app-user";

export async function requireOnboardingCompleteOrRedirect() {
  const { userId } = await auth();
  if (!userId) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(WORKSPACE_BASE)}`);
  }

  const appUser = await getAppUserByClerkId(userId);
  if (appUser && isPlatformSuperAdmin(appUser.platformRole)) {
    redirect(SUPER_ADMIN_BASE);
  }
  if (!appUser || !isOnboardingCompleted(appUser)) {
    redirect(CREATE_WORKSPACE_PATH);
    return;
  }

  const allowed = await organizationAllowsWorkspaceAccess(
    appUser.organizationId,
    appUser.platformRole
  );
  if (!allowed) {
    redirect(ORGANIZATION_SUSPENDED_PATH);
  }
}

export async function redirectIfOnboardingComplete() {
  const { userId } = await auth();
  if (!userId) return;

  const appUser = await getAppUserByClerkId(userId);
  if (appUser && isPlatformSuperAdmin(appUser.platformRole)) {
    redirect(SUPER_ADMIN_BASE);
    return;
  }
  if (appUser && isOnboardingCompleted(appUser)) {
    redirect(WORKSPACE_BASE);
  }
}
