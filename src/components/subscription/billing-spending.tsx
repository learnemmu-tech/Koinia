"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBillingReceipts } from "@/components/subscription/billing-history";
import { minorUnitsToAmount } from "@/lib/subscription/billing-eligibility";
import { formatPlanPrice } from "@/lib/subscription/plans";
import type { SubscriptionSnapshot } from "@/types/subscription";

function money(amountMinor: number, currency: string) {
  const amount = minorUnitsToAmount(amountMinor, currency);
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function BillingSpending({
  snapshot,
}: {
  snapshot: SubscriptionSnapshot;
}) {
  const { receipts, error, loading, reload } = useBillingReceipts(
    snapshot.subscription.organizationId
  );
  const paid = snapshot.plan.id === "starter" || snapshot.plan.id === "professional";
  const interval = snapshot.subscription.billingInterval === "yearly" ? "yearly" : "monthly";
  const upcoming =
    paid && !snapshot.subscription.cancelAtPeriodEnd
      ? formatPlanPrice(snapshot.plan, interval)
      : null;
  const currency = receipts?.[0]?.currency ?? "INR";
  const totalMinor = (receipts ?? []).reduce((sum, receipt) => sum + receipt.amountMinor, 0);
  const byMonth = new Map<string, number>();
  for (const receipt of receipts ?? []) {
    const date = receipt.paidAt ? new Date(receipt.paidAt) : null;
    const key =
      date && !Number.isNaN(date.getTime())
        ? date.toLocaleDateString(undefined, { month: "short", year: "numeric" })
        : "Undated";
    byMonth.set(key, (byMonth.get(key) ?? 0) + receipt.amountMinor);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border/70 bg-card px-4 py-4">
          <p className="text-xs text-muted-foreground">Confirmed charges</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {loading ? "—" : money(totalMinor, currency)}
          </p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card px-4 py-4">
          <p className="text-xs text-muted-foreground">Upcoming renewal</p>
          <p className="mt-1 text-xl font-semibold">
            {upcoming ?? "None scheduled"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Catalog price for the current plan. Razorpay bills the subscription amount at renewal. This is not a prorated difference.
          </p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card px-4 py-4">
          <p className="text-xs text-muted-foreground">Recorded payments</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {loading ? "—" : receipts?.length ?? 0}
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-border/70 bg-card">
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold">Spending history</h2>
          <Button variant="ghost" size="sm" onClick={() => void reload()} disabled={loading}>
            Refresh
          </Button>
        </div>
        {loading ? <Skeleton className="m-4 h-24" /> : null}
        {error ? (
          <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={() => void reload()}>
              Try again
            </Button>
          </div>
        ) : null}
        {!loading && !error && byMonth.size === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No confirmed charges yet. Spending appears after Razorpay records a paid invoice.
          </p>
        ) : null}
        {!loading && !error && byMonth.size > 0 ? (
          <ul className="divide-y divide-border/60">
            {[...byMonth.entries()].map(([month, amount]) => (
              <li key={month} className="flex items-center justify-between px-4 py-3 text-sm sm:px-5">
                <span>{month}</span>
                <span className="font-medium tabular-nums">{money(amount, currency)}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="border-t border-border/70 px-4 py-3 text-sm sm:px-5">
          <Link href="/dashboard/billing/invoices" className="font-medium text-primary">
            Open receipts
          </Link>
        </div>
      </section>
    </div>
  );
}
