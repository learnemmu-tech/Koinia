"use client";

import Link from "next/link";
import { Crown, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PlanId } from "@/types/subscription";
import { getPlan } from "@/lib/subscription/plans";

const PLAN_STYLES: Record<
  PlanId,
  { variant: "secondary" | "default" | "outline"; className?: string }
> = {
  free: { variant: "secondary" },
  starter: {
    variant: "outline",
    className: "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  professional: {
    variant: "default",
    className: "bg-primary text-primary-foreground",
  },
  enterprise: {
    variant: "outline",
    className:
      "border-amber-500/40 bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-800 dark:text-amber-200",
  },
};

type PlanBadgeProps = {
  planId: PlanId;
  className?: string;
  showIcon?: boolean;
  asLink?: boolean;
};

export function PlanBadge({
  planId,
  className,
  showIcon = true,
  asLink = false,
}: PlanBadgeProps) {
  const plan = getPlan(planId);
  const style = PLAN_STYLES[planId];
  const Icon = planId === "enterprise" ? Crown : Sparkles;

  const badge = (
    <Badge
      variant={style.variant}
      className={cn(
        "gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider sm:text-xs",
        style.className,
        className
      )}
    >
      {showIcon ?
        <Icon className="size-3 shrink-0" aria-hidden />
      : null}
      {plan.name}
    </Badge>
  );

  if (asLink) {
    return (
      <Link href="/pricing" className="inline-flex">
        {badge}
      </Link>
    );
  }

  return badge;
}
