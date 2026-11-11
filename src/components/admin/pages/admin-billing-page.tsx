"use client";

import type { ReactNode } from "react";

import { RequireAdmin } from "@/components/auth/require-admin";
import { RequireOrganizationAdmin } from "@/components/auth/require-organization-admin";
import { BillingHistory } from "@/components/subscription/billing-history";
import { BillingOverview } from "@/components/subscription/billing-overview";
import { BillingSpending } from "@/components/subscription/billing-spending";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscription } from "@/context/subscription-context";

const COPY = {
  overview: {
    title: "Overview",
    description: "Your current plan, billing period, and renewal.",
  },
  plans: {
    title: "Plans & Usage",
    description: "Usage, feature access, and plan options.",
  },
  spending: {
    title: "Spending",
    description: "Confirmed subscription charges and the next catalog renewal.",
  },
  invoices: {
    title: "Billing & Invoices",
    description: "Payment receipts for confirmed charges. These are not tax invoices.",
  },
} as const;

export type BillingRouteSection = keyof typeof COPY;

function BillingFrame({
  section,
  children,
}: {
  section: BillingRouteSection;
  children: ReactNode;
}) {
  const copy = COPY[section];
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Billing & Subscription
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{copy.description}</p>
      </header>
      {children}
    </div>
  );
}

function AdminBillingContent({ section }: { section: BillingRouteSection }) {
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
          <p className="text-sm text-destructive">{error ?? "No subscription data available."}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => void refetch()}>
            Try again
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
