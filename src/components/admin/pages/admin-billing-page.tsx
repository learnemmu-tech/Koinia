"use client";

import { RequireAdmin } from "@/components/auth/require-admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { BillingOverview } from "@/components/subscription/billing-overview";
import { PlanBadge } from "@/components/subscription/plan-badge";
import { useSubscription } from "@/context/subscription-context";

function AdminBillingContent() {
  const { snapshot, loading, error, refetch } = useSubscription();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Billing & Subscription"
        description="Manage your church plan, monitor usage, and explore upgrades."
      >
        {snapshot?.subscription.planId ?
          <PlanBadge planId={snapshot.subscription.planId} asLink />
        : null}
      </AdminPageHeader>
      <BillingOverview
        snapshot={snapshot}
        loading={loading}
        error={error}
        onRetry={refetch}
      />
    </div>
  );
}

export function AdminBillingPageClient() {
  return (
    <RequireAdmin>
      <AdminBillingContent />
    </RequireAdmin>
  );
}
