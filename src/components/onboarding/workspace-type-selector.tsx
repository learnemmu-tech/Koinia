"use client";

import { Check, Church, Network } from "lucide-react";

import type { WorkspaceType } from "@/types/organization";
import { cn } from "@/lib/utils";

const WORKSPACE_OPTIONS: {
  value: WorkspaceType;
  title: string;
  description: string;
  icon: typeof Church;
}[] = [
  {
    value: "independent_church",
    title: "Independent Church",
    description: "Single church with one location",
    icon: Church,
  },
  {
    value: "multi_church_org",
    title: "Multi-Church Organization",
    description: "Multiple churches under one organization",
    icon: Network,
  },
];

type WorkspaceTypeSelectorProps = {
  value: WorkspaceType;
  onChange: (value: WorkspaceType) => void;
};

export function WorkspaceTypeSelector({
  value,
  onChange,
}: WorkspaceTypeSelectorProps) {
  return (
    <div className="grid gap-4">
      {WORKSPACE_OPTIONS.map((option) => {
        const Icon = option.icon;
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className={cn(
              "relative flex w-full flex-col items-start gap-4 rounded-2xl border p-6 text-left transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              selected
                ? "border-primary bg-primary/[0.08]"
                : "border-border bg-card hover-hover:hover:border-border hover-hover:hover:bg-accent active:bg-accent"
            )}
          >
            <span
              className={cn(
                "absolute right-5 top-5 flex size-5 items-center justify-center rounded-full border",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-white/20 text-transparent"
              )}
              aria-hidden
            >
              <Check className="size-3" />
            </span>
            <div
              className={cn(
                "flex size-12 items-center justify-center rounded-xl",
                selected ? "bg-primary/15 text-primary" : "bg-primary/10 text-primary/80"
              )}
            >
              <Icon className="size-6" aria-hidden />
            </div>
            <span className="pr-8">
              <span className="block text-lg font-semibold text-foreground">
                {option.title}
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                {option.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
