"use client";

import { UpgradeModal } from "@/components/subscription/upgrade-modal";
import { SubscriptionProvider } from "@/context/subscription-context";

export function SubscriptionShell({ children }: { children: React.ReactNode }) {
  return (
    <SubscriptionProvider>
      {children}
      <UpgradeModal />
    </SubscriptionProvider>
  );
}
