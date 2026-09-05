import "server-only";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { CREATE_WORKSPACE_PATH } from "@/lib/auth/auth-paths";
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
  if (!appUser || !isOnboardingCompleted(appUser)) {
    redirect(CREATE_WORKSPACE_PATH);
  }
}

export async function redirectIfOnboardingComplete() {
  const { userId } = await auth();
  if (!userId) return;

  const appUser = await getAppUserByClerkId(userId);
  if (appUser && isOnboardingCompleted(appUser)) {
    redirect(WORKSPACE_BASE);
  }
}
