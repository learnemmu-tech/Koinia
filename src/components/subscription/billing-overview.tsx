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
import { formatLimitValue, PLAN_ORDER, PLANS } from "@/lib/subscription/plans";
import { BILLING_USAGE_KEYS } from "@/lib/subscription/limits";

type BillingOverviewProps = {
  snapshot: SubscriptionSnapshot | undefined;
  loading?: boolean;
  error?: string | null;
  showUpgradeOptions?: boolean;
  onRetry?: () => void;
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
}: BillingOverviewProps) {
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
  const paidDaysRemaining = snapshot.subscription.currentPeriodEnd
    ? Math.max(
        0,
        Math.ceil((snapshot.subscription.currentPeriodEnd - Date.now()) / (24 * 60 * 60 * 1000))
      )
    : null;
  const isPaidPlan = plan.id === "starter" || plan.id === "professional";
  const periodEnd = snapshot.subscription.currentPeriodEnd
    ? new Date(snapshot.subscription.currentPeriodEnd).toLocaleDateString()
    : null;
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

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Current plan
            </p>
            <h3 className="text-2xl font-semibold">{plan.name}</h3>
            <p className="text-sm text-muted-foreground">{plan.description}</p>
          </div>
          <PlanBadge planId={plan.id} asLink />
        </div>
        {isPaidPlan ?
          <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 px-3 py-3 text-sm">
            <p className="font-medium">
              {snapshot.subscription.status === "active" ? "Active" : "Subscription needs attention"}
            </p>
            {periodEnd ?
              <p className="mt-1 text-muted-foreground">
                {snapshot.subscription.cancelAtPeriodEnd ? "Paid access ends" : "Renews"} on {periodEnd}
                {paidDaysRemaining != null ?
                  ` (${paidDaysRemaining} ${paidDaysRemaining === 1 ? "day" : "days"})`
                : null}
              </p>
            : null}
          </div>
        : null}
        {trial.phase === "reminder" ?
          <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
            Your 14-day trial ends in {trial.daysRemaining}{" "}
            {trial.daysRemaining === 1 ? "day" : "days"}. Existing content will be preserved.
          </p>
        : null}
        {trial.phase === "urgent" ?
          <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            Your trial expires in {trial.daysRemaining}{" "}
            {trial.daysRemaining === 1 ? "day" : "days"}. Your content stays available to view.
          </p>
        : null}
        {trial.phase === "expired" ?
          <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            Your 14-day trial has ended. Existing content is preserved. Paid checkout is not
            available yet.
          </p>
        : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/pricing">Compare plans</Link>
          </Button>
          {!isPaidPlan && showUpgradeOptions ?
            <RazorpaySubscriptionButton planId="starter" label="Start Starter" onComplete={onRetry} />
          : null}
          {plan.id === "starter" && showUpgradeOptions ?
            <RazorpaySubscriptionButton planId="professional" label="Upgrade to Professional" onComplete={onRetry} />
          : null}
          {isPaidPlan ? <CancelRazorpaySubscriptionButton onComplete={onRetry} /> : null}
          {plan.id === "enterprise" || plan.contactSales ?
            <Button size="sm" asChild>
              <Link href={`mailto:${siteConfig.author.email}?subject=Enterprise%20Plan`}>
                <Mail className="mr-1.5 size-4" />
                Contact Sales
              </Link>
            </Button>
          : null}
        </div>
      </section>

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

      {showUpgradeOptions ?
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
      : null}
    </div>
  );
}
