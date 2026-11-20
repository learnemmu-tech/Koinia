"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { RequireAdmin } from "@/components/auth/require-admin";
import { RequireOrganizationAdmin } from "@/components/auth/require-organization-admin";
import { BillingHistory } from "@/components/subscription/billing-history";
import { BillingOverview } from "@/components/subscription/billing-overview";
import { BillingSpending } from "@/components/subscription/billing-spending";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscription } from "@/context/subscription-context";

export type BillingRouteSection = "overview" | "plans" | "spending" | "invoices";

function BillingFrame({
  section,
  children,
}: {
  section: BillingRouteSection;
  children: ReactNode;
}) {
  const t = useTranslations("billing");
  const titleKey = {
    overview: "overviewTitle",
    plans: "plansTitle",
    spending: "spendingTitle",
    invoices: "invoicesTitle",
  } as const;
  const descriptionKey = {
    overview: "overviewDescription",
    plans: "plansDescription",
    spending: "spendingDescription",
    invoices: "invoicesDescription",
  } as const;
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("titleFull")}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{t(titleKey[section])}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t(descriptionKey[section])}</p>
      </header>
      {children}
    </div>
  );
}

function AdminBillingContent({ section }: { section: BillingRouteSection }) {
  const t = useTranslations("billing");
  const { snapshot, loading, error, refetch } = useSubscription();

  if (loading) {
    return (
      <BillingFrame section={section}>
        <Skeleton className="h-40 w-full rounded-xl" />
      </BillingFrame>
    );
  }

  if (error || !snapshot) {
    return (
      <BillingFrame section={section}>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <p className="text-sm text-destructive">{error ?? t("noSubscription")}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => void refetch()}>
            {t("tryAgain")}
          </Button>
        </div>
      </BillingFrame>
    );
  }

  return (
    <BillingFrame section={section}>
      {section === "overview" || section === "plans" ? (
        <BillingOverview
          snapshot={snapshot}
          section={section}
          onRetry={refetch}
        />
      ) : null}
      {section === "spending" ? <BillingSpending snapshot={snapshot} /> : null}
      {section === "invoices" ? (
        <BillingHistory organizationId={snapshot.subscription.organizationId} />
      ) : null}
    </BillingFrame>
  );
}

export function AdminBillingPageClient({
  section = "overview",
}: {
  section?: BillingRouteSection;
}) {
  return (
    <RequireAdmin>
      <RequireOrganizationAdmin>
        <AdminBillingContent section={section} />
      </RequireOrganizationAdmin>
    </RequireAdmin>
  );
}
