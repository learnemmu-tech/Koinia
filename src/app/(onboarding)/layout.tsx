import { currentUser } from "@clerk/nextjs/server";

import { OnboardingFrame } from "@/components/onboarding/onboarding-frame";
import { upsertAppUserFromClerk } from "@/lib/postgres/upsert-app-user";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkUser = await currentUser();
  if (clerkUser) {
    const email = clerkUser.primaryEmailAddress?.emailAddress?.trim() ?? "";
    if (email) {
      await upsertAppUserFromClerk({
        clerkId: clerkUser.id,
        email,
        firstName: clerkUser.firstName ?? "",
        lastName: clerkUser.lastName ?? "",
        emailVerified:
          clerkUser.primaryEmailAddress?.verification?.status === "verified",
      }).catch(() => undefined);
    }
  }

  return <OnboardingFrame>{children}</OnboardingFrame>;
}
