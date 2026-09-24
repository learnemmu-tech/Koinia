"use client";

import type { ReactNode } from "react";
import { Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAllowTrialWrite } from "@/context/subscription-context";
import type { TrialWriteRequest } from "@/lib/subscription/trial-write";

type AdminToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  trialWrite?: TrialWriteRequest;
};

export function AdminToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  children,
  actionLabel,
  onAction,
  actionDisabled = false,
  trialWrite,
}: AdminToolbarProps) {
  const t = useTranslations("common");
  const allowWrite = useAllowTrialWrite();
  return (
      <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full min-w-0 sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder ?? t("searchPlaceholder")}
          className="rounded-full pl-9"
        />
      </div>
      <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
        {children}
        {actionLabel && onAction ?
          <Button
            size="sm"
            onClick={() => {
              if (trialWrite && !allowWrite(trialWrite)) return;
              onAction();
            }}
            disabled={actionDisabled}
            className="h-11 w-full gap-2 rounded-full px-4 font-semibold shadow-sm sm:h-9 sm:w-auto"
          >
            <Plus className="size-4" />
            {actionLabel}
          </Button>
        : null}
      </div>
    </div>
  );
}
