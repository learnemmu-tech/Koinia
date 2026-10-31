"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Lock, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useOrganizationOptional } from "@/context/organization-context";
import { useSubscriptionOptional } from "@/context/subscription-context";
import { isMembershipStatusPath } from "@/lib/auth/auth-paths";
import { isTrialAccessExpired } from "@/lib/subscription/trial-write";
import { cn } from "@/lib/utils";
import { roleMeetsMinimum } from "@/types/membership";

function BannerLeafDecal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 140" fill="none" aria-hidden className={className}>
      <g fill="currentColor">
        <path
          opacity="0.38"
          d="M118 18c6 16 4 36-8 50 12 10 34 16 54 8-2-24-18-46-46-58Z"
        />
        <path
          opacity="0.28"
          d="M86 8c18 14 28 36 24 58 22-2 40-16 50-34C140 12 110 2 86 8Z"
        />
        <path
          opacity="0.22"
          d="M108 52c16 10 38 12 56 2-6 22-22 40-44 50-6-18-12-36-12-52Z"
        />
        <path
          opacity="0.18"
          d="M72 36c8 18 22 32 40 40-4-20-4-40 4-56-16 2-32 6-44 16Z"
        />
      </g>
    </svg>
  );
}

function useCanManageBilling() {
  const organization = useOrganizationOptional();
  const membership = organization?.membership;
  if (!membership || membership.status !== "active") return false;
  return roleMeetsMinimum(membership.role, "org_admin");
}

export function TrialLifecycleBanner() {
  const pathname = usePathname();
  const subscription = useSubscriptionOptional();
  const canManageBilling = useCanManageBilling();
  const organization = useOrganizationOptional();
  const trial = subscription?.snapshot?.trial;
  const [dismissed, setDismissed] = useState(false);

  const daysIntoTrial = trial?.daysIntoTrial ?? 0;
  const expired = isTrialAccessExpired(trial);
  const remaining = Math.max(0, 15 - daysIntoTrial);
  const showReminder = Boolean(!expired && trial?.isTrial && daysIntoTrial >= 8);
  if (isMembershipStatusPath(pathname)) return null;
  const awaitingSnapshot =
    Boolean(organization?.loading) || Boolean(subscription?.loading);
  if (awaitingSnapshot && !trial) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className="sr-only"
      >
        Checking subscription status
      </div>
    );
  }
  if (!trial) return null;
  if (trial.access === "paid") return null;
  if (!expired && !showReminder) return null;
  if (dismissed) return null;

  let title = "";
  let message = "";
  if (expired) {
    title = "Your FaithConnectHub trial has ended";
    message = canManageBilling
      ? "Your church is currently in read-only mode. Existing content remains safe and available to view."
      : "This church workspace is currently in read-only mode. Existing content remains available.";
  } else if (daysIntoTrial >= 14) {
    title = "Your FaithConnectHub trial ends today";
    message =
      "Your 14-day free trial ends today. Upgrade your plan to continue creating and managing your church content after the trial.";
  } else if (remaining === 2) {
    title = "Your trial ends in 2 days";
    message = "Upgrade your plan to keep creating and managing your church content.";
  } else if (remaining === 3) {
    title = "Your trial ends in 3 days";
    message =
      "Upgrade your plan to keep the church workspace active and continue content management.";
  } else if (remaining === 5) {
    title = "Your FaithConnectHub trial ends soon";
    message = "You have 5 days remaining in your free trial.";
  } else {
    title =
      remaining === 7
        ? "Your FaithConnectHub trial is halfway through"
        : "Your FaithConnectHub trial ends soon";
    message = `You have ${remaining} days remaining in your free trial.`;
  }

  function dismissBanner() {
    setDismissed(true);
  }

  return (
    <div
      className={cn(
        "relative z-20 w-full shrink-0 overflow-hidden border-b",
        expired
          ? "border-primary/10 bg-[hsl(var(--muted)/0.65)]"
          : daysIntoTrial >= 12
            ? "border-primary/20 bg-primary/5"
            : "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100"
      )}
      role="status"
    >
      {expired ?
        <BannerLeafDecal className="pointer-events-none absolute right-72 top-1/2 hidden h-[7.25rem] w-[9.5rem] -translate-y-[58%] text-primary md:block" />
      : null}

      <div className="relative z-[1] box-border flex w-full flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-8">
        <div className="flex min-w-0 flex-1 items-start gap-2.5 pr-10 sm:items-center sm:gap-3 sm:pr-0">
          <div
            className={cn(
              "relative flex size-9 shrink-0 items-center justify-center rounded-full sm:size-10",
              expired ? "bg-primary/10 text-primary" : "bg-background/70"
            )}
          >
            <FileText className="size-4 sm:size-5" aria-hidden />
            {expired ?
              <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Lock className="size-2.5" aria-hidden />
              </span>
            : null}
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold leading-5 text-foreground sm:text-sm">
              {title}
            </p>
            <p className="mt-0.5 text-sm leading-5 text-muted-foreground">
              {message}
            </p>
          </div>
        </div>

        <div className="contents sm:flex sm:w-auto sm:shrink-0 sm:items-center sm:justify-end sm:gap-5">
          {canManageBilling ?
            <div className="flex min-w-0 flex-wrap items-center gap-2 pl-[46px] sm:pl-0">
              {expired ?
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-11 min-h-11 rounded-lg bg-background px-3 sm:h-9"
                >
                  <Link href="/pricing">Learn More</Link>
                </Button>
              : null}
              <Button
                size="sm"
                asChild
                className="h-11 min-h-11 rounded-lg px-3 sm:h-9"
              >
                <Link href={expired ? "/pricing" : "/dashboard/billing"}>
                  Upgrade Plan
                </Link>
              </Button>
            </div>
          : null}
          <button
            type="button"
            onClick={dismissBanner}
            className="absolute right-1 top-1 z-[2] flex size-10 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:static"
            aria-label="Dismiss trial notification"
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
}
