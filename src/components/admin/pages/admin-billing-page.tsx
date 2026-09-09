"use client";

import { useTranslations } from "next-intl";

import { RequireAdmin } from "@/components/auth/require-admin";
import { RequireOrganizationAdmin } from "@/components/auth/require-organization-admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { BillingOverview } from "@/components/subscription/billing-overview";
import { PlanBadge } from "@/components/subscription/plan-badge";
import { useSubscription } from "@/context/subscription-context";

function AdminBillingContent() {
  const t = useTranslations("billing");
  const { snapshot, loading, error, refetch } = useSubscription();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("titleFull")}
        description={t("adminDescription")}
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
      <RequireOrganizationAdmin>
        <AdminBillingContent />
      </RequireOrganizationAdmin>
    </RequireAdmin>
  );
}
