"use client";

import { TrialLifecycleBanner } from "@/components/subscription/trial-lifecycle-banner";
import { UpgradeModal } from "@/components/subscription/upgrade-modal";
import { SubscriptionProvider } from "@/context/subscription-context";

export function SubscriptionShell({ children }: { children: React.ReactNode }) {
  return (
    <SubscriptionProvider>
      <TrialLifecycleBanner />
      {children}
      <UpgradeModal />
    </SubscriptionProvider>
  );
}
