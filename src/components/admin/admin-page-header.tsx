"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { typePageTitleClass } from "@/lib/responsive-classes";
import { Plus } from "lucide-react";

type AdminPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  children?: ReactNode;
};

export function AdminPageHeader({
  eyebrow = "Admin",
  title,
  description,
  actionLabel,
  onAction,
  actionDisabled = false,
  children,
}: AdminPageHeaderProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
      <div className="h-1 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/60">
            {eyebrow}
          </p>
          <h1 className={typePageTitleClass}>{title}</h1>
          {description ? (
            <p className="mt-1 text-fluid-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {children}
          {actionLabel && onAction ? (
            <Button
              size="sm"
              onClick={onAction}
              disabled={actionDisabled}
              className="h-11 w-full gap-2 rounded-full px-5 font-semibold shadow sm:h-9 sm:w-auto"
            >
              <Plus className="size-4" />
              {actionLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
