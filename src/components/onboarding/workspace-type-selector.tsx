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
    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:items-stretch sm:gap-5">
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
              "relative flex w-full max-w-[280px] cursor-pointer flex-col items-center rounded-2xl border p-6 text-center transition-all duration-200 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              selected ?
                "border-2 border-primary bg-primary/[0.08]"
              : "border border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
            )}
          >
            {selected ?
              <span className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-3.5" aria-hidden />
              </span>
            : null}

            <div
              className={cn(
                "flex size-12 items-center justify-center rounded-xl",
                selected ?
                  "bg-primary/15 text-primary"
                : "bg-primary/10 text-primary/80"
              )}
            >
              <Icon className="size-6" aria-hidden />
            </div>

            <p className="mt-4 text-lg font-bold text-foreground">{option.title}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              {option.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
