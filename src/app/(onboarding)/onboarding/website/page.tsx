import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { OnboardingWebsiteSetupScreen } from "@/components/onboarding/onboarding-website-setup-screen";
import {
  CREATE_WORKSPACE_PATH,
  ONBOARDING_SUCCESS_PATH,
  ORGANIZATION_SUSPENDED_PATH,
  SUPER_ADMIN_BASE,
} from "@/lib/auth/auth-paths";
import { resolveFirstTimeStage } from "@/lib/auth/first-time-destination";
import { organizationAllowsWorkspaceAccess } from "@/lib/auth/organization-workspace-access-server";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { getChurchRowById } from "@/lib/postgres/tenants";
import { listTemplateManifests } from "@/lib/templates/registry";

export const metadata = {
  title: "Choose your website design",
  description:
    "Choose a design for your church website. You can change this later from Website settings.",
};

export default async function OnboardingWebsitePage() {
  const { userId } = await auth();
  if (!userId) {
    redirect(`/signin?callbackUrl=${encodeURIComponent("/onboarding/website")}`);
  }

  const appUser = await getAppUserByClerkId(userId);
  if (appUser && isPlatformSuperAdmin(appUser.platformRole)) {
    redirect(SUPER_ADMIN_BASE);
  }

  const stage = await resolveFirstTimeStage(appUser);
  if (stage === "onboarding") {
    redirect(CREATE_WORKSPACE_PATH);
  }
  if (stage === "ready") {
    redirect(ONBOARDING_SUCCESS_PATH);
  }

  if (!appUser?.organizationId) {
    redirect(CREATE_WORKSPACE_PATH);
  }

  const allowed = await organizationAllowsWorkspaceAccess(
    appUser.organizationId,
    appUser.platformRole
  );
  if (!allowed) {
    redirect(ORGANIZATION_SUSPENDED_PATH);
  }

  const churchRow = appUser.activeChurchId
    ? await getChurchRowById(appUser.activeChurchId)
    : null;

  if (!churchRow || churchRow.organizationId !== appUser.organizationId) {
    redirect(CREATE_WORKSPACE_PATH);
  }

  const publicSlug = churchRow.joinSlug.trim() || churchRow.slug.trim();
  if (!publicSlug) {
    redirect(CREATE_WORKSPACE_PATH);
  }

  return (
    <OnboardingWebsiteSetupScreen
      churchId={churchRow.id}
      churchName={churchRow.name.trim() || "Your church"}
      publicSlug={publicSlug}
      templates={listTemplateManifests()}
    />
  );
}
