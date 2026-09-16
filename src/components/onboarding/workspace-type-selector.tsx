"use client";

import { Check, Church, Network } from "lucide-react";

import type { WorkspaceType } from "@/types/organization";
import { cn } from "@/lib/utils";

type WorkspaceTypeSelectorProps = {
  value: WorkspaceType;
  onChange: (value: WorkspaceType) => void;
};

export function WorkspaceTypeSelector({
  value,
  onChange,
}: WorkspaceTypeSelectorProps) {
  const independentSelected = value !== "multi_church_org";

  return (
    <div className="grid gap-4">
      <button
        type="button"
        onClick={() => onChange("independent_church")}
        aria-pressed={independentSelected}
        className={cn(
          "relative flex w-full flex-col items-start gap-4 rounded-2xl border p-6 text-left transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          independentSelected
            ? "border-primary bg-primary/[0.08]"
            : "border-border bg-card hover-hover:hover:border-border hover-hover:hover:bg-accent active:bg-accent"
        )}
      >
        <span
          className={cn(
            "absolute right-5 top-5 flex size-5 items-center justify-center rounded-full border",
            independentSelected
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
            independentSelected ? "bg-primary/15 text-primary" : "bg-primary/10 text-primary/80"
          )}
        >
          <Church className="size-6" aria-hidden />
        </div>
        <span className="pr-8">
          <span className="block text-lg font-semibold text-foreground">
            Independent Church
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
            Single church with one location
          </span>
        </span>
      </button>

      <div
        role="group"
        inert
        aria-disabled="true"
        aria-label="Multi-Church Organization, coming soon. This option is not available yet."
        className="relative flex w-full cursor-not-allowed select-none pointer-events-none flex-col items-start gap-4 rounded-2xl border border-dashed border-border/80 bg-muted/25 p-6 text-left opacity-80"
      >
        <span className="absolute right-5 top-5 inline-flex items-center rounded-full border border-border/70 bg-background/90 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-muted-foreground">
          Coming Soon
        </span>
        <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Network className="size-6" aria-hidden />
        </div>
        <span className="pr-24">
          <span className="block text-lg font-semibold text-foreground/80">
            Multi-Church Organization
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
            Multiple churches under one organization
          </span>
        </span>
      </div>
    </div>
  );
}
