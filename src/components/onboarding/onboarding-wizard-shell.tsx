"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type OnboardingWizardShellProps = {
  step: number;
  totalSteps: number;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  variant?: "centered" | "form";
};

export function OnboardingWizardShell({
  step,
  totalSteps,
  title,
  description,
  children,
  className,
  variant = "centered",
}: OnboardingWizardShellProps) {
  const progress = Math.round((step / totalSteps) * 100);

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500",
        className
      )}
    >
      <div className="mb-8 space-y-3">
        <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <span>
            Step {step} of {totalSteps}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-2 text-center">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">
          {title}
        </h1>
        {description ?
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            {description}
          </p>
        : null}
      </div>

      <div
        className={cn(
          "mt-8",
          variant === "form" &&
            "rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8"
        )}
      >
        {children}
      </div>
    </div>
  );
}
