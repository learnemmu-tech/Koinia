import "server-only";

import {
  CREATE_WORKSPACE_PATH,
  ONBOARDING_SUCCESS_PATH,
  ONBOARDING_WEBSITE_PATH,
} from "@/lib/auth/auth-paths";
import { WORKSPACE_BASE } from "@/lib/dashboard-routes";
import {
  isOnboardingCompleted,
  type AppUserRow,
} from "@/lib/postgres/app-user";
import { isWebsiteSetupCompleted } from "@/lib/postgres/church-websites";

export type FirstTimeStage = "onboarding" | "website" | "ready";

export async function resolveFirstTimeStage(
  appUser: Pick<
    AppUserRow,
    "needsChurchOnboarding" | "activeChurchId" | "organizationId"
  > | null
): Promise<FirstTimeStage> {
  if (!appUser || !isOnboardingCompleted(appUser) || !appUser.organizationId) {
    return "onboarding";
  }

  const websiteReady = await isWebsiteSetupCompleted(
    appUser.activeChurchId,
    appUser.organizationId
  );
  return websiteReady ? "ready" : "website";
}

export async function resolveFirstTimeDestination(
  appUser: Pick<
    AppUserRow,
    "needsChurchOnboarding" | "activeChurchId" | "organizationId"
  > | null,
  readyDestination = WORKSPACE_BASE
): Promise<string> {
  const stage = await resolveFirstTimeStage(appUser);
  if (stage === "onboarding") return CREATE_WORKSPACE_PATH;
  if (stage === "website") return ONBOARDING_WEBSITE_PATH;
  return readyDestination;
}

export function pathForFirstTimeStage(
  stage: FirstTimeStage,
  readyDestination = WORKSPACE_BASE
): string {
  if (stage === "onboarding") return CREATE_WORKSPACE_PATH;
  if (stage === "website") return ONBOARDING_WEBSITE_PATH;
  if (stage === "ready") return readyDestination;
  return readyDestination;
}

export { ONBOARDING_SUCCESS_PATH };
