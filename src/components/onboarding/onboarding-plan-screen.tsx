"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ONBOARDING_SUCCESS_PATH } from "@/lib/auth/auth-paths";
import {
  bindFirebaseAuthCurrentUser,
  firebaseAuth,
  navigateAfterAuth,
  sessionUserFromClerk,
} from "@/lib/firebase-auth-service";
import { formatPlanPrice, sharedAnnualSavingsPercent } from "@/lib/subscription/plans";
import { TRIAL_DURATION_DAYS } from "@/lib/subscription/trial";
import { cn } from "@/lib/utils";
import type { BillingInterval, PlanDefinition } from "@/types/subscription";

type OnboardingPlanScreenProps = {
  organizationId: string;
  churchName: string;
  plans: PlanDefinition[];
  initialPlanId: string | null;
  initialInterval: BillingInterval;
};

const STARTER_LINES = [
  "Up to 300 members",
  "Heritage and Signature templates",
  "Unlimited songs, sermons, and articles",
  "Donations, events, and community features",
  "Shepherd AI — limited monthly usage",
];

const PRO_LINES = [
  "Up to 1,000 members",
  "Shepherd AI — higher monthly usage than Starter",
  "Advanced analytics",
  "Up to 5 admin seats",
];

function catalogLines(plan: PlanDefinition): string[] {
  const allowed = plan.id === "professional" ? PRO_LINES : STARTER_LINES;
  return allowed.filter((line) => plan.highlights.includes(line));
}

export function OnboardingPlanScreen({
  organizationId,
  churchName,
  plans,
  initialPlanId,
  initialInterval,
}: OnboardingPlanScreenProps) {
  const [interval, setInterval] = useState<BillingInterval>(initialInterval);
  const [trialSelected, setTrialSelected] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(initialPlanId);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choosePlan(planId: string) {
    if (activating) return;
    setSelectedId(planId);
    setError(null);
    setActivating(true);
    try {
      const user = firebaseAuth.currentUser ?? sessionUserFromClerk();
      if (user) bindFirebaseAuthCurrentUser(user);
      const token = await firebaseAuth.currentUser?.getIdToken();
      if (!token) throw new Error("Please sign in to continue");

      const response = await fetch("/api/onboarding/plan", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          planId,
          billingInterval: interval,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Unable to save the selected plan. Please try again.");
      }
      navigateAfterAuth(ONBOARDING_SUCCESS_PATH);
    } catch (activationError) {
      setError(
        activationError instanceof Error
          ? activationError.message
          : "Unable to save the selected plan. Please try again."
      );
      setActivating(false);
    }
  }

  const billingNote =
    interval === "yearly"
      ? "Billing begins after the trial at the annual price."
      : "Billing begins after the trial at the monthly price.";
  const annualSavings = sharedAnnualSavingsPercent(plans);
  const annualBadge =
    interval === "yearly" && annualSavings
      ? annualSavings === 20
        ? "Save 20% when billed annually"
        : `Save ~${annualSavings}% when billed annually`
      : null;

  return (
    <div className="w-full max-w-5xl animate-in fade-in duration-500">
      <section className="rounded-3xl border bg-card/95 px-4 py-5 shadow-sm sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Choose a plan for {churchName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {TRIAL_DURATION_DAYS} days free on the plan you choose. {billingNote}
          </p>
          <div className="mt-3 inline-flex rounded-lg border bg-muted p-0.5">
            <button
              type="button"
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium",
                interval === "monthly" ? "bg-background shadow-sm" : "text-muted-foreground"
              )}
              onClick={() => setInterval("monthly")}
            >
              Monthly
            </button>
            <button
              type="button"
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium",
                interval === "yearly" ? "bg-background shadow-sm" : "text-muted-foreground"
              )}
              onClick={() => setInterval("yearly")}
            >
              Annual
            </button>
          </div>
          {annualBadge ? (
            <p className="mt-2 text-xs font-medium text-primary">{annualBadge}</p>
          ) : null}
        </div>

        {error ? (
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-4 grid items-stretch gap-3 md:grid-cols-2 lg:grid-cols-3">
          <article
            className={cn(
              "flex flex-col rounded-xl border bg-background p-4",
              trialSelected && "border-primary bg-primary/5 ring-2 ring-primary/25"
            )}
          >
            <h2 className="text-sm font-semibold">Free Trial</h2>
            <p className="mt-2 text-sm font-medium">14 Days Free</p>
            <p className="text-2xl font-semibold tracking-tight">₹0 Today</p>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              Enjoy {TRIAL_DURATION_DAYS} days of access to the features included in your selected plan.
            </p>
            <ul className="mt-3 flex-1 space-y-1.5 text-sm">
              {[
                "14-day free trial.",
                "No payment required to activate.",
                "Access to the selected paid plan's features.",
                billingNote,
              ].map((line) => (
                <li key={line} className="flex gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="default"
              className="mt-4 h-9 w-full"
              disabled={activating}
              onClick={() => {
                setError(null);
                setTrialSelected((current) => !current);
              }}
            >
              {trialSelected ? "Trial Selected" : "Start Free Trial"}
            </Button>
          </article>

          {plans.map((plan) => {
            const selected = plan.id === selectedId;
            const highlights = catalogLines(plan);
            return (
              <article
                key={plan.id}
                className={cn(
                  "flex flex-col rounded-xl border bg-background p-4",
                  selected && "border-primary bg-primary/5 ring-2 ring-primary/25"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold">{plan.name}</h2>
                  {plan.highlighted ? (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                      Recommended
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {formatPlanPrice(plan, interval)}
                </p>
                <p className="text-xs text-muted-foreground">
                  per {interval === "yearly" ? "year" : "month"}
                </p>
                <p className="mt-2 text-sm leading-5 text-muted-foreground">{plan.description}</p>
                <ul className="mt-3 flex-1 space-y-1.5 text-sm">
                  {plan.id === "professional" ? (
                    <li className="flex gap-2 font-medium">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                      <span>Everything in Starter</span>
                    </li>
                  ) : null}
                  {highlights.map((highlight) => (
                    <li key={highlight} className="flex gap-2">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  variant={selected ? "default" : "outline"}
                  className="mt-4 h-9 w-full"
                  disabled={activating}
                  onClick={() => void choosePlan(plan.id)}
                >
                  {activating && selected ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : null}
                  Choose plan
                </Button>
              </article>
            );
          })}
        </div>

      </section>
    </div>
  );
}
