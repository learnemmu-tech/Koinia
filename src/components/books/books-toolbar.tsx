"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { BookStatus } from "@/types/book";
import type {
  BookCatalogFilter,
  BookEditionFilter,
  BookSortOption,
} from "@/lib/books/filters";

const CATALOG_FILTER_IDS = [
  "all",
  "digital",
  "physical",
  "free",
  "paid",
] as const satisfies ReadonlyArray<BookCatalogFilter>;

const EDITION_FILTER_IDS = [
  "all",
  "digital",
  "physical",
  "both",
] as const satisfies ReadonlyArray<BookEditionFilter>;

const STATUS_FILTER_IDS = ["all", "draft", "published", "archived"] as const;

const SORT_OPTIONS = [
  { id: "latest" as const, labelKey: "sortLatest" as const },
  { id: "title" as const, labelKey: "sortTitle" as const },
  { id: "author" as const, labelKey: "sortAuthor" as const },
];

function FilterPills<T extends string>({
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
        className="flex min-w-0 flex-wrap items-center gap-2"
      >
        {options.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={value === item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              "inline-flex h-9 shrink-0 items-center rounded-full border px-3.5 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              value === item.id ?
                "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:bg-muted/60"
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
  catalogFilter,
  onCatalogFilterChange,
  sort,
  onSortChange,
  variant = "admin",
}: {
  search: string;
  onSearchChange: (value: string) => void;
  editionFilter?: BookEditionFilter;
  onEditionFilterChange?: (value: BookEditionFilter) => void;
  statusFilter?: "all" | BookStatus;
  onStatusFilterChange?: (value: "all" | BookStatus) => void;
  showStatusFilter?: boolean;
  catalogFilter?: BookCatalogFilter;
  onCatalogFilterChange?: (value: BookCatalogFilter) => void;
  sort?: BookSortOption;
  onSortChange?: (value: BookSortOption) => void;
  variant?: "admin" | "catalog";
}) {
  const t = useTranslations("books");

  const catalogFilters = CATALOG_FILTER_IDS.map((id) => ({
    id,
    label: t(id),
  }));

  const editionFilters = EDITION_FILTER_IDS.map((id) => ({
    id,
    label: t(id),
  }));

  const statusFilters = STATUS_FILTER_IDS.map((id) => ({
    id,
    label: id === "all" ? t("allStatus") : t(id),
  }));

  return (
    <div className="flex w-full flex-col gap-3.5">
      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchAria")}
          className="h-11 rounded-xl border-border/70 bg-card pl-10 text-sm shadow-sm"
        />
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {variant === "catalog" && catalogFilter != null && onCatalogFilterChange ?
          <FilterPills
            label={t("edition")}
            value={catalogFilter}
            onChange={onCatalogFilterChange}
            options={catalogFilters}
            ariaLabel={t("filterEdition")}
          />
        : editionFilter != null && onEditionFilterChange ?
          <FilterPills
            label={t("edition")}
            value={editionFilter}
            onChange={onEditionFilterChange}
            options={editionFilters}
            ariaLabel={t("filterEdition")}
          />
        : null}

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {showStatusFilter && statusFilter != null && onStatusFilterChange ?
            <FilterPills
              label={t("status")}
              value={statusFilter}
              onChange={onStatusFilterChange}
              options={statusFilters}
              ariaLabel={t("filterStatus")}
            />
          : null}

          {variant === "catalog" && sort != null && onSortChange ?
            <Select
              value={sort}
              onValueChange={(value) => onSortChange(value as BookSortOption)}
            >
              <SelectTrigger
                aria-label={t("sortAria")}
                className="h-9 w-auto min-w-[9.5rem] gap-1.5 rounded-lg border-border/70 bg-card px-3 text-xs font-medium shadow-sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          : null}
        </div>
      </div>
    </div>
  );
}
