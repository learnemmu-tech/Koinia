import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { ONBOARDING_SUCCESS_PATH } from "@/lib/auth/auth-paths";

export const metadata = {
  title: "Choose your plan",
  description: "Choose a FaithConnectHub plan and start your 14-day free trial.",
};

/** Plan selection remains implemented, but onboarding currently skips this step. */
export default async function OnboardingPlanPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect(`/signin?callbackUrl=${encodeURIComponent("/onboarding/plan")}`);
  }

  redirect(ONBOARDING_SUCCESS_PATH);
}
