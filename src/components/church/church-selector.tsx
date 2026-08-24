"use client";

import { Building2, Check, ChevronsUpDown } from "lucide-react";

import { useActiveChurch } from "@/context/active-church-context";
import { useOrganizationOptional } from "@/context/organization-context";
import { MULTI_CHURCH_ENABLED } from "@/lib/feature-flags";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ChurchSelectorProps = {
  className?: string;
  compact?: boolean;
};

export function ChurchSelector({ className, compact = false }: ChurchSelectorProps) {
  const organization = useOrganizationOptional();
  const {
    churches: platformChurches,
    activeChurch: platformActiveChurch,
    activeChurchId,
    setActiveChurchId,
  } = useActiveChurch();

  const churches =
    organization?.churches.length ? organization.churches : platformChurches;

  const activeChurch =
    churches.find((church) => church.id === activeChurchId) ?? platformActiveChurch;

  const showSwitcher =
    organization?.showChurchSwitcher ??
    (MULTI_CHURCH_ENABLED && churches.filter((c) => c.isActive).length > 1);

  if (!showSwitcher) {
    if (!activeChurch || compact) return null;

    return (
      <div
        className={cn(
          "hidden items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground lg:flex",
          className
        )}
      >
        <Building2 className="size-3.5 shrink-0" aria-hidden />
        <span className="max-w-[160px] truncate font-medium text-foreground/80">
          {activeChurch.name}
        </span>
      </div>
    );
  }

  const activeChurches = churches.filter((church) => church.isActive);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-9 max-w-[220px] justify-between gap-2 px-3",
            className
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <Building2 className="size-3.5 shrink-0 text-primary" aria-hidden />
            <span className="truncate text-xs font-medium">
              {activeChurch?.name ?? "Select Church"}
            </span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" aria-hidden />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Switch Church
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {activeChurches.map((church) => (
          <DropdownMenuItem
            key={church.id}
            onClick={() => setActiveChurchId(church.id)}
            className="flex items-center justify-between gap-2"
          >
            <span className="truncate">{church.name}</span>
            {church.id === activeChurchId ?
              <Check className="size-4 shrink-0 text-primary" aria-hidden />
            : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
