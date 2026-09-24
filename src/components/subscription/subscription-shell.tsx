"use client";

import { TrialExpiredActionDialog } from "@/components/subscription/trial-expired-dialogs";
import { TrialExpiredDialog } from "@/components/subscription/trial-expired-dialog";
import { UpgradeModal } from "@/components/subscription/upgrade-modal";
import { SubscriptionProvider, useSubscriptionOptional } from "@/context/subscription-context";

function SubscriptionOverlays() {
  const subscription = useSubscriptionOptional();
  return (
    <>
      <TrialExpiredDialog />
      <TrialExpiredActionDialog
        open={Boolean(subscription?.expiredAction.open)}
        message={subscription?.expiredAction.message ?? ""}
        onOpenChange={(open) => {
          if (!open) subscription?.closeExpiredAction();
        }}
      />
      <UpgradeModal />
    </>
  );
}

export function SubscriptionShell({ children }: { children: React.ReactNode }) {
  return (
    <SubscriptionProvider>
      <SubscriptionOverlays />
      {children}
    </SubscriptionProvider>
  );
}
