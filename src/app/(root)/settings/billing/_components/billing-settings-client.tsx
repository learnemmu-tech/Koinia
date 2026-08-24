"use client";

import { CreditCard } from "lucide-react";

import { RequireAuth } from "@/components/auth/require-auth";
import { BillingOverview } from "@/components/subscription/billing-overview";
import { PlanBadge } from "@/components/subscription/plan-badge";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useSubscriptionQuery } from "@/hooks/use-subscription-query";
import { resolveChurchIdForWrite } from "@/lib/church-scope";

export function BillingSettingsClient() {
  const { profile } = useFirebaseAuth();
  const churchId = resolveChurchIdForWrite(profile?.churchId);
  const { data, isLoading, error, refetch } = useSubscriptionQuery(churchId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CreditCard className="size-5 text-primary" aria-hidden />
            <h2 className="font-heading text-lg drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-xl md:text-2xl">
              Billing & Subscription
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            View your plan, usage limits, and available features.
          </p>
        </div>
        {data?.subscription.planId ?
          <PlanBadge planId={data.subscription.planId} asLink />
        : null}
      </div>

      <div className="p-4 pt-0">
        <BillingOverview
          snapshot={data}
          loading={isLoading}
          error={error instanceof Error ? error.message : null}
          onRetry={() => refetch()}
        />
      </div>
    </div>
  );
}

export function BillingSettingsPage() {
  return (
    <RequireAuth>
      <BillingSettingsClient />
    </RequireAuth>
  );
}
