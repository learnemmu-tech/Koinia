"use client";

import Link from "next/link";
import { Check, Mail, X } from "lucide-react";

import { PlanBadge } from "@/components/subscription/plan-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/config/site";
import type { SubscriptionSnapshot } from "@/types/subscription";
import { formatLimitValue, PLAN_ORDER, PLANS } from "@/lib/subscription/plans";

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
        <Check className="size-4 shrink-0 text-green-600" aria-label="Included" />
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

  const { plan, usageChecks, features } = snapshot;
  const limitedChecks = usageChecks.filter((item) => item.limit !== null);

  const featureRows: { label: string; key: keyof typeof features }[] = [
    { label: "Email notifications", key: "canUseEmailNotifications" },
    { label: "Analytics", key: "canUseAnalytics" },
    { label: "Advanced analytics", key: "canUseAdvancedAnalytics" },
    { label: "Custom branding", key: "canCustomizeBranding" },
    { label: "Event registration", key: "canUseEventRegistration" },
    { label: "Multiple admins", key: "canInviteAdmins" },
    { label: "White label", key: "canUseWhiteLabel" },
    { label: "Custom domain", key: "canUseCustomDomain" },
    { label: "API access", key: "canUseApiAccess" },
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
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/pricing">Compare plans</Link>
          </Button>
          {plan.id !== "enterprise" && showUpgradeOptions ?
            <Button size="sm" disabled>
              Upgrade — Coming Soon
            </Button>
          : null}
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
          {limitedChecks.map((item) => (
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
              key={row.key}
              label={row.label}
              enabled={Boolean(features[row.key])}
            />
          ))}
        </div>
      </section>

      {showUpgradeOptions ?
        <section className="rounded-2xl border border-border/60 bg-muted/20 p-5 sm:p-6">
          <h3 className="font-semibold">Upgrade options</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Payment integration coming soon. Compare plans or contact sales for
            Enterprise.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {PLAN_ORDER.filter((id) => id !== plan.id).map((id) => {
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
                </div>
              );
            })}
          </div>
        </section>
      : null}
    </div>
  );
}
