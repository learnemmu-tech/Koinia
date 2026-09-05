"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type OnboardingWizardShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  variant?: "centered" | "form";
};

export function OnboardingWizardShell({
  title,
  description,
  children,
  className,
  variant = "centered",
}: OnboardingWizardShellProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500",
        className
      )}
    >
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
            "rounded-2xl border border-border bg-card p-6 sm:p-8"
        )}
      >
        {children}
      </div>
    </div>
  );
}
