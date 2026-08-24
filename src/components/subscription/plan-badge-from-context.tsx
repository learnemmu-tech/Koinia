"use client";

import { PlanBadge } from "@/components/subscription/plan-badge";
import { useSubscriptionOptional } from "@/context/subscription-context";
import type { PlanId } from "@/types/subscription";

type PlanBadgeFromContextProps = {
  className?: string;
  asLink?: boolean;
  showIcon?: boolean;
  fallbackPlanId?: PlanId;
};

/** Shows the current church plan when subscription context is available. */
export function PlanBadgeFromContext({
  className,
  asLink = true,
  showIcon = true,
  fallbackPlanId = "free",
}: PlanBadgeFromContextProps) {
  const subscription = useSubscriptionOptional();
  const planId = subscription?.snapshot?.subscription.planId ?? fallbackPlanId;

  return (
    <PlanBadge
      planId={planId}
      className={className}
      asLink={asLink}
      showIcon={showIcon}
    />
  );
}
