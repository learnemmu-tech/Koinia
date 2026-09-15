"use client";

import Link from "next/link";

import { useSubscriptionOptional } from "@/context/subscription-context";
import { cn } from "@/lib/utils";

export function TrialLifecycleBanner() {
  const subscription = useSubscriptionOptional();
  const trial = subscription?.snapshot?.trial;
  if (!trial?.isTrial) return null;
  if (trial.phase !== "reminder" && trial.phase !== "urgent" && trial.phase !== "expired") {
    return null;
  }

  const days = trial.daysRemaining ?? 0;
  const dayLabel = days === 1 ? "day" : "days";

  const message =
    trial.phase === "expired" ?
      "Your 14-day trial has ended. Existing content is preserved and remains available to view."
    : trial.phase === "urgent" ?
      `Your trial expires in ${days} ${dayLabel}. Existing content will be preserved.`
    : `Your 14-day trial ends in ${days} ${dayLabel}. Existing content will be preserved.`;

  return (
    <div
      className={cn(
        "border-b px-4 py-2.5 text-center text-sm",
        trial.phase === "reminder" &&
          "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100",
        (trial.phase === "urgent" || trial.phase === "expired") &&
          "border-destructive/30 bg-destructive/5 text-destructive"
      )}
      role="status"
    >
      {message}{" "}
      <Link href="/pricing" className="font-medium underline underline-offset-2">
        View plans
      </Link>
    </div>
  );
}
