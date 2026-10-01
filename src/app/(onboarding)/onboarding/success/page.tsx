import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { OnboardingSuccessScreen } from "@/components/onboarding/onboarding-success-screen";
import {
  CREATE_WORKSPACE_PATH,
  ONBOARDING_WEBSITE_PATH,
  ORGANIZATION_SUSPENDED_PATH,
  SUPER_ADMIN_BASE,
} from "@/lib/auth/auth-paths";
import { resolveFirstTimeStage } from "@/lib/auth/first-time-destination";
import { organizationAllowsWorkspaceAccess } from "@/lib/auth/organization-workspace-access-server";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import { buildJoinChurchUrl } from "@/lib/join-url";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { getChurchWebsiteConfig } from "@/lib/postgres/church-websites";
import { mapChurch } from "@/lib/postgres/mappers";
import { getChurchRowById } from "@/lib/postgres/tenants";
import { getTemplateManifest } from "@/lib/templates/registry";
import {
  buildChurchWebsiteUrl,
  churchWebsitePath,
} from "@/lib/templates/paths";

export const metadata = {
  title: "Your church is ready",
  description: "Your church website is ready to share.",
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

  const appUser = await getAppUserByClerkId(userId);
  if (appUser && isPlatformSuperAdmin(appUser.platformRole)) {
    redirect(SUPER_ADMIN_BASE);
  }

  const stage = await resolveFirstTimeStage(appUser);
  if (stage === "onboarding") {
    redirect(CREATE_WORKSPACE_PATH);
  }
  if (stage === "website") {
    redirect(ONBOARDING_WEBSITE_PATH);
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

  const church = mapChurch(churchRow);
  const website = await getChurchWebsiteConfig(church);
  const headerStore = await headers();
  const origin = originFromRequestHeaders(headerStore);
  const selectedTemplateName = getTemplateManifest(website.activeTemplate).name;

  return (
    <OnboardingSuccessScreen
      churchName={church.name.trim() || "Your church"}
      publicPath={churchWebsitePath(publicSlug)}
      publicUrl={buildChurchWebsiteUrl(publicSlug, origin)}
      joinUrl={buildJoinChurchUrl(publicSlug, origin)}
      selectedTemplateName={selectedTemplateName}
    />
  );
}
