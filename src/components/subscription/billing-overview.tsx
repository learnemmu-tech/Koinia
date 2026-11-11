"use client";

import Link from "next/link";
import { Check, Mail, X } from "lucide-react";

import { PlanBadge } from "@/components/subscription/plan-badge";
import {
  CancelRazorpaySubscriptionButton,
  RazorpaySubscriptionButton,
} from "@/components/subscription/razorpay-subscription-button";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/config/site";
import type { SubscriptionSnapshot } from "@/types/subscription";
import { useBillingReceipts } from "@/components/subscription/billing-history";
import { BILLING_USAGE_KEYS } from "@/lib/subscription/limits";
import { formatLimitValue, formatPlanPrice, PLAN_ORDER, PLANS } from "@/lib/subscription/plans";

export type BillingPageSection = "overview" | "plans";

type BillingOverviewProps = {
  snapshot: SubscriptionSnapshot | undefined;
  loading?: boolean;
  error?: string | null;
  showUpgradeOptions?: boolean;
  onRetry?: () => void;
  section?: BillingPageSection;
};

function FeatureRow({
  label,
  enabled,
}: {
  label: string;
  enabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {enabled ?
        <Check className="size-4 shrink-0 text-foreground" aria-label="Included" />
      : <X className="size-4 shrink-0 text-muted-foreground/50" aria-label="Not included" />}
    </div>
  );
}

export function BillingOverview({
  snapshot,
  loading,
  error,
  showUpgradeOptions = true,
  onRetry,
  section = "overview",
}: BillingOverviewProps) {
  const receiptsQuery = useBillingReceipts(snapshot?.subscription.organizationId ?? "");
  const paymentMethod =
    receiptsQuery.receipts?.[0]?.paymentMethodSummary ?? null;
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
        {onRetry ?
          <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
            Try again
          </Button>
        : null}
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        No subscription data available.
      </div>
    );
  }

  const { plan, usageChecks, features, trial } = snapshot;
  const isPaidPlan = plan.id === "starter" || plan.id === "professional";
  const interval =
    snapshot.subscription.billingInterval === "yearly" ? "yearly" : "monthly";
  const catalogPrice = formatPlanPrice(plan, interval);
  const periodStart = snapshot.subscription.currentPeriodStart
    ? new Date(snapshot.subscription.currentPeriodStart).toLocaleDateString()
    : null;
  const periodEnd = snapshot.subscription.currentPeriodEnd
    ? new Date(snapshot.subscription.currentPeriodEnd).toLocaleDateString()
    : null;
  const statusLabel =
    trial.access === "paid"
      ? snapshot.subscription.cancelAtPeriodEnd
        ? "Cancels at period end"
        : snapshot.subscription.status === "past_due"
          ? "Past due"
          : "Active"
      : trial.access === "trial"
        ? "Trial"
        : "Trial ended";
  const usageByKey = new Map(usageChecks.map((item) => [item.key, item]));
  const displayedChecks = BILLING_USAGE_KEYS.map((key) => usageByKey.get(key)).filter(
    (item): item is NonNullable<typeof item> => Boolean(item)
  );

  const featureRows: { label: string; enabled: boolean }[] = [
    { label: "Donations", enabled: features.canCreateDonations },
    {
      label:
        trial.isTrial && features.canUseShepherdAi && trial.shepherdDaysRemaining != null
          ? `Shepherd AI (${trial.shepherdDaysRemaining} days left)`
        : trial.isTrial && !features.canUseShepherdAi
          ? "Shepherd AI (available for first 10 trial days)"
        : "Shepherd AI",
      enabled: features.canUseShepherdAi,
    },
    { label: "Email notifications", enabled: features.canUseEmailNotifications },
    { label: "Analytics", enabled: features.canUseAnalytics },
    { label: "Advanced analytics", enabled: features.canUseAdvancedAnalytics },
    { label: "Custom branding", enabled: features.canCustomizeBranding },
    { label: "Event registration", enabled: features.canUseEventRegistration },
    { label: "Multiple admins", enabled: features.canInviteAdmins },
    { label: "White label", enabled: features.canUseWhiteLabel },
    { label: "Custom domain", enabled: features.canUseCustomDomain },
    { label: "API access", enabled: features.canUseApiAccess },
  ];

  const subscriptionCard = (
      <section className="rounded-xl border border-border/70 bg-card">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Current subscription
              </p>
              <span className="inline-flex rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium">
                {statusLabel}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-semibold tracking-tight">{plan.name}</h3>
              <PlanBadge planId={plan.id} showIcon={false} />
            </div>
            <p className="text-sm text-muted-foreground">
              {catalogPrice}
              {plan.monthlyPrice ? ` · billed ${interval}` : ""}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end [&_button]:h-9">
            {showUpgradeOptions && !isPaidPlan ?
              <RazorpaySubscriptionButton planId="starter" label="Upgrade plan" onComplete={onRetry} />
            : null}
            {showUpgradeOptions && plan.id === "starter" ?
              <RazorpaySubscriptionButton planId="professional" label="Change plan" onComplete={onRetry} />
            : null}
            {plan.id === "enterprise" || plan.contactSales ?
              <Button size="sm" asChild>
                <Link href={`mailto:${siteConfig.author.email}?subject=Enterprise%20Plan`}>
                  <Mail className="mr-1.5 size-4" />
                  Contact sales
                </Link>
              </Button>
            : null}
            <Button variant="outline" size="sm" asChild>
              <Link href="/pricing">Compare plans</Link>
            </Button>
            {isPaidPlan ? <CancelRazorpaySubscriptionButton onComplete={onRetry} /> : null}
          </div>
        </div>
        <dl className="grid gap-px border-t border-border/70 bg-border/70 sm:grid-cols-3">
          {[
            ["Billing period", periodStart && periodEnd ? `${periodStart} – ${periodEnd}` : "Not started"],
            [
              snapshot.subscription.cancelAtPeriodEnd ? "Access ends" : "Next renewal",
              periodEnd ?? "Not scheduled",
            ],
            ...(paymentMethod ? [["Payment method", paymentMethod] as const] : []),
            ...(trial.access === "trial"
              ? [[
                  "Trial",
                  `${trial.daysRemaining} ${trial.daysRemaining === 1 ? "day" : "days"} left`,
                ]]
              : []),
          ].map(([label, value]) => (
            <div key={label} className="bg-card px-4 py-3 sm:px-5">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        {trial.access === "expired" ?
          <p className="border-t border-border/70 px-4 py-3 text-sm text-muted-foreground sm:px-5">
            Your 14-day trial has ended. Existing content stays available to view. Upgrade to restore content management.
          </p>
        : null}
      </section>
  );

  const usageSection = (
      <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
        <h3 className="font-semibold">Usage & limits</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Live usage for your church workspace.
        </p>
        <div className="mt-4 space-y-4">
          {displayedChecks.map((item) => (
            <div key={item.key} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {item.current.toLocaleString()} / {formatLimitValue(item.limit)}
                </span>
              </div>
              {item.percent != null ?
                <Progress
                  value={item.percent}
                  className={item.atLimit ? "bg-destructive/20" : undefined}
                />
              : null}
            </div>
          ))}
        </div>
      </section>
  );

  const featureSection = (
      <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
        <h3 className="font-semibold">Feature access</h3>
        <div className="mt-2 divide-y divide-border/50">
          {featureRows.map((row) => (
            <FeatureRow
              key={row.label}
              label={row.label}
              enabled={row.enabled}
            />
          ))}
        </div>
      </section>
  );

  const upgradeSection = showUpgradeOptions ? (
        <section className="rounded-2xl border border-border/60 bg-muted/20 p-5 sm:p-6">
          <h3 className="font-semibold">Upgrade options</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Start a paid plan with Razorpay or contact sales for Enterprise.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {PLAN_ORDER.filter((id) => id !== plan.id && id !== "free").map((id) => {
              const p = PLANS[id];
              return (
                <div
                  key={id}
                  className="rounded-xl border border-border/50 bg-card px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{p.name}</p>
                    <PlanBadge planId={id} showIcon={false} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.tagline}
                  </p>
                  {id === "starter" || id === "professional" ?
                    <div className="mt-3">
                      <RazorpaySubscriptionButton
                        planId={id}
                        label="Start Subscription"
                        onComplete={onRetry}
                      />
                    </div>
                  : null}
                </div>
              );
            })}
          </div>
        </section>
  ) : null;

  if (section === "plans") {
    return (
      <div className="space-y-6">
        <section className="rounded-xl border border-border/70 bg-card px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current plan</p>
              <div className="mt-1 flex items-center gap-2">
                <h2 className="text-lg font-semibold">{plan.name}</h2>
                <PlanBadge planId={plan.id} showIcon={false} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{catalogPrice}</p>
            </div>
            <span className="inline-flex rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium">
              {statusLabel}
            </span>
          </div>
        </section>
        {usageSection}
        {featureSection}
        {upgradeSection}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {subscriptionCard}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/dashboard/billing/plans"
          className="rounded-xl border border-border/70 bg-card px-4 py-3 text-sm font-medium hover:bg-muted/40"
        >
          Review usage and plans
        </Link>
        <Link
          href="/dashboard/billing/invoices"
          className="rounded-xl border border-border/70 bg-card px-4 py-3 text-sm font-medium hover:bg-muted/40"
        >
          View receipts
        </Link>
      </div>
    </div>
  );
}
