"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { BookStatus } from "@/types/book";
import type { BookEditionFilter } from "@/lib/books/filters";

const EDITION_FILTER_IDS = ["all", "digital", "physical", "both"] as const satisfies ReadonlyArray<BookEditionFilter>;

const STATUS_FILTER_IDS = ["all", "draft", "published", "archived"] as const;

function SegmentedControl<T extends string>({
  label,
  value,
  onChange,
  options,
  ariaLabel,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<{ id: T; label: string }>;
  ariaLabel: string;
}) {
  return (
    <div className="min-w-0">
      <p className="sr-only">{label}</p>
      <div
        role="group"
        aria-label={ariaLabel}
        className="flex h-9 min-w-0 items-center overflow-x-auto rounded-md border border-border bg-muted/40 p-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {options.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={value === item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              "h-8 shrink-0 rounded px-2.5 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              value === item.id ?
                "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function BooksToolbar({
  search,
  onSearchChange,
  editionFilter,
  onEditionFilterChange,
  statusFilter,
  onStatusFilterChange,
  showStatusFilter = false,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  editionFilter: BookEditionFilter;
  onEditionFilterChange: (value: BookEditionFilter) => void;
  statusFilter?: "all" | BookStatus;
  onStatusFilterChange?: (value: "all" | BookStatus) => void;
  showStatusFilter?: boolean;
}) {
  const t = useTranslations("books");

  const editionFilters = EDITION_FILTER_IDS.map((id) => ({
    id,
    label: t(id),
  }));

  const statusFilters = STATUS_FILTER_IDS.map((id) => ({
    id,
    label: id === "all" ? t("allStatus") : t(id),
  }));

  return (
    <div className="flex w-full flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="relative w-full shrink-0 md:max-w-sm md:flex-1 lg:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchAria")}
          className="h-9 rounded-md pl-9 text-sm"
        />
      </div>

      <div className="flex w-full min-w-0 flex-col gap-2 md:w-auto md:shrink-0 md:items-end">
        <SegmentedControl
          label={t("edition")}
          value={editionFilter}
          onChange={onEditionFilterChange}
          options={editionFilters}
          ariaLabel={t("filterEdition")}
        />
        {showStatusFilter && statusFilter != null && onStatusFilterChange ?
          <SegmentedControl
            label={t("status")}
            value={statusFilter}
            onChange={onStatusFilterChange}
            options={statusFilters}
            ariaLabel={t("filterStatus")}
          />
        : null}
      </div>
    </div>
  );
}
