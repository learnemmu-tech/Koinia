import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { OnboardingSuccessScreen } from "@/components/onboarding/onboarding-success-screen";
import {
  CREATE_WORKSPACE_PATH,
  ORGANIZATION_SUSPENDED_PATH,
  SUPER_ADMIN_BASE,
} from "@/lib/auth/auth-paths";
import { organizationAllowsWorkspaceAccess } from "@/lib/auth/organization-workspace-access-server";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import { WORKSPACE_BASE } from "@/lib/dashboard-routes";
import { buildJoinChurchUrl } from "@/lib/join-url";
import {
  getAppUserByClerkId,
  isOnboardingCompleted,
} from "@/lib/postgres/app-user";
import { getChurchRowById } from "@/lib/postgres/tenants";

export const metadata = {
  title: "Your church workspace is ready",
  description: "Share your FaithConnectHub church join link with members.",
};

function originFromRequestHeaders(
  headerStore: Awaited<ReturnType<typeof headers>>
): string | undefined {
  const host =
    headerStore.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    headerStore.get("host")?.trim();
  if (!host) return undefined;
  const proto =
    headerStore.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function OnboardingSuccessPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect(`/signin?callbackUrl=${encodeURIComponent("/onboarding/success")}`);
  }

  const clerkId = userId;
  const appUser = await getAppUserByClerkId(clerkId);
  if (appUser && isPlatformSuperAdmin(appUser.platformRole)) {
    redirect(SUPER_ADMIN_BASE);
  }
  if (!appUser || !isOnboardingCompleted(appUser) || !appUser.organizationId) {
    redirect(CREATE_WORKSPACE_PATH);
  }

  const allowed = await organizationAllowsWorkspaceAccess(
    appUser.organizationId,
    appUser.platformRole
  );
  if (!allowed) {
    redirect(ORGANIZATION_SUSPENDED_PATH);
  }

  const church = appUser.activeChurchId
    ? await getChurchRowById(appUser.activeChurchId)
    : null;

  if (!church || church.organizationId !== appUser.organizationId) {
    redirect(WORKSPACE_BASE);
  }

  const joinSlug = church.joinSlug.trim();
  if (!joinSlug) {
    redirect(WORKSPACE_BASE);
  }

  const headerStore = await headers();
  const joinUrl = buildJoinChurchUrl(
    joinSlug,
    originFromRequestHeaders(headerStore)
  );

  return (
    <OnboardingSuccessScreen
      churchName={church.name.trim() || "Your church"}
      joinUrl={joinUrl}
    />
  );
}
