"use client";

import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";

import { PlanBadge } from "@/components/subscription/plan-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { siteConfig } from "@/config/site";
import { useSubscription } from "@/context/subscription-context";
import { formatLimitValue, getPlan } from "@/lib/subscription/plans";
import { USAGE_LIMIT_LABELS } from "@/lib/subscription/limits";

export function UpgradeModal() {
  const {
    snapshot,
    upgradeModal,
    closeUpgradeModal,
  } = useSubscription();

  const recommendedPlanId =
    upgradeModal.recommendedPlanId ?? "starter";
  const recommendedPlan = getPlan(recommendedPlanId);
  const currentPlan = snapshot?.plan;
  const limitKey = upgradeModal.limitKey;
  const usageCheck =
    limitKey ?
      snapshot?.usageChecks.find((item) => item.key === limitKey)
    : undefined;

  const isEnterprise = recommendedPlan.contactSales;

  return (
    <Dialog
      open={upgradeModal.open}
      onOpenChange={(open) => {
        if (!open) closeUpgradeModal();
      }}
    >
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0 sm:max-w-lg">
        <div className="border-b bg-muted/30 px-6 py-5">
          <DialogHeader className="space-y-3 text-left">
            <DialogTitle className="text-xl font-semibold">
              Upgrade your plan
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {upgradeModal.message ??
                "Unlock more capacity and premium features for your ministry."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-5">
          {currentPlan ?
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Current plan
                </p>
                <p className="mt-1 font-semibold">{currentPlan.name}</p>
              </div>
              <PlanBadge planId={currentPlan.id} />
            </div>
          : null}

          {usageCheck ?
            <div className="space-y-2 rounded-xl border border-border/60 bg-card p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {USAGE_LIMIT_LABELS[usageCheck.key]}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {usageCheck.current.toLocaleString()}
                  {" / "}
                  {formatLimitValue(usageCheck.limit)}
                </span>
              </div>
              {usageCheck.percent != null ?
                <Progress value={usageCheck.percent} className="h-2" />
              : null}
            </div>
          : null}

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-primary/80">
              Recommended
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{recommendedPlan.name}</p>
                <p className="text-sm text-muted-foreground">
                  {recommendedPlan.tagline}
                </p>
              </div>
              <PlanBadge planId={recommendedPlan.id} />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 border-t bg-muted/20 px-6 py-4 sm:flex-row sm:justify-between">
          <Button variant="ghost" onClick={closeUpgradeModal}>
            Not now
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/pricing">
                View plans
                <ArrowUpRight className="ml-1.5 size-4" />
              </Link>
            </Button>
            {isEnterprise ?
              <Button asChild>
                <Link href={`mailto:${siteConfig.author.email}?subject=Enterprise%20Plan%20Inquiry`}>
                  <Mail className="mr-1.5 size-4" />
                  Contact Sales
                </Link>
              </Button>
            : <Button disabled>Coming Soon</Button>}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
