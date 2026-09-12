"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { useEventListener } from "@/hooks/use-event-listner";
import { useSearchableNavItems } from "@/hooks/use-searchable-nav-items";
import { useIsTyping } from "@/hooks/use-store";
import { useNavLabel } from "@/i18n/nav";
import { fetchWorshipCatalogAction } from "@/lib/actions/worship-catalog";
import type { WorshipCatalog } from "@/lib/cached-worship-data";
import {
  buildGlobalSearchResults,
  toGlobalSearchSections,
} from "@/lib/global-search";
import { filterNavDestinations } from "@/lib/nav-search";
import type { TenantScope } from "@/lib/organization/tenant-scope";
import { cn, isMacOs } from "@/lib/utils";
import { getGlobalSearchPlaceholder } from "@/lib/worship-collection";
import {
  filterArticlesLocal,
  filterEventsLocal,
  filterSermonsLocal,
  filterSongsLocal,
} from "@/lib/worship-search-utils";

import { SearchResultRow } from "./search-result-row";

const EMPTY_CATALOG: WorshipCatalog = {
  songs: [],
  sermons: [],
  articles: [],
  events: [],
};

export type SearchMenuProps = {
  className?: string;
  scope: TenantScope;
  placeholder?: string;
  enableShortcut?: boolean;
};

type FlatResult = {
  id: string;
  href: string;
  title: string;
  subtitle?: string;
  coverUrl?: string;
  kind: "page" | "content";
  sectionLabel: string;
  icon?: ComponentType<{ className?: string }>;
};

export function SearchMenuClient({
  scope,
  className,
  placeholder,
  enableShortcut = true,
}: SearchMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const tCommon = useTranslations("common");
  const navLabel = useNavLabel();
  const inputId = useId();
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navItems = useSearchableNavItems();

  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [catalog, setCatalog] = useState<WorshipCatalog>(EMPTY_CATALOG);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const debouncedQuery = useDebounce(query.trim(), 280);
  const [_, setIsTyping] = useIsTyping();

  const searchPlaceholder = placeholder ?? getGlobalSearchPlaceholder();
  const searchLabel = tCommon("search");
  const shortcutKey = mounted && isMacOs() ? "⌘" : "Ctrl";

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadCatalog = useCallback(async () => {
    if (catalogLoaded || catalogLoading) return;
    setCatalogLoading(true);
    try {
      // Scope is resolved server-side from the session (not client IDs).
      const nextCatalog = await fetchWorshipCatalogAction();
      setCatalog(nextCatalog);
    } catch {
      toast.error("Unable to load search catalog");
      setCatalog(EMPTY_CATALOG);
    } finally {
      setCatalogLoaded(true);
      setCatalogLoading(false);
    }
  }, [catalogLoaded, catalogLoading]);

  useEffect(() => {
    setCatalog(EMPTY_CATALOG);
    setCatalogLoaded(false);
  }, [scope.organizationId, scope.churchId, scope.branchId]);

  useEffect(() => {
    if (isOpen) void loadCatalog();
  }, [isOpen, loadCatalog]);

  useEffect(() => {
    setIsOpen(false);
    setQuery("");
  }, [pathname]);

  useEffect(() => {
    setIsTyping(isOpen && debouncedQuery.length > 0);
    return () => setIsTyping(false);
  }, [debouncedQuery, isOpen, setIsTyping]);

  useEffect(() => {
    setActiveIndex(0);
  }, [debouncedQuery]);

  const queryReady = debouncedQuery.length >= 2;

  const pageRows = useMemo(() => {
    if (!queryReady) return [] as FlatResult[];
    const byHref = new Map(navItems.map((item) => [item.href, item]));
    return filterNavDestinations(navItems, debouncedQuery).map((result) => ({
      id: result.resultId,
      href: result.href,
      title: navLabel(result.title),
      subtitle: "Go to page",
      kind: "page" as const,
      sectionLabel: "Pages",
      icon: byHref.get(result.href)?.icon,
    }));
  }, [debouncedQuery, navItems, navLabel, queryReady]);

  const contentRows = useMemo(() => {
    if (!queryReady || !catalogLoaded) return [] as FlatResult[];

    const grouped = buildGlobalSearchResults({
      songs: filterSongsLocal(catalog.songs, debouncedQuery).slice(0, 5),
      sermons: filterSermonsLocal(catalog.sermons, debouncedQuery).slice(0, 5),
      articles: filterArticlesLocal(catalog.articles, debouncedQuery).slice(0, 5),
      events: filterEventsLocal(catalog.events, debouncedQuery).slice(0, 5),
    });

    return toGlobalSearchSections(grouped).flatMap((section) =>
      section.results.map((result) => ({
        id: result.resultId,
        href: result.href,
        title: result.title,
        subtitle: result.subtitle ?? section.label,
        coverUrl: result.coverUrl,
        kind: "content" as const,
        sectionLabel: "Content",
      }))
    );
  }, [catalog, catalogLoaded, debouncedQuery, queryReady]);

  const flatResults = useMemo(
    () => [...pageRows, ...contentRows],
    [contentRows, pageRows]
  );

  const groupedForRender = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, FlatResult[]>();
    for (const row of flatResults) {
      if (!map.has(row.sectionLabel)) {
        map.set(row.sectionLabel, []);
        order.push(row.sectionLabel);
      }
      map.get(row.sectionLabel)!.push(row);
    }
    return order.map((label) => ({ label, results: map.get(label)! }));
  }, [flatResults]);

  const showHint =
    Boolean(debouncedQuery) && debouncedQuery.length < 2 && isOpen;

  const showEmptyFinal =
    queryReady &&
    !catalogLoading &&
    catalogLoaded &&
    flatResults.length === 0;

  function openSearch() {
    setIsOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function closeSearch() {
    setIsOpen(false);
    setQuery("");
    setActiveIndex(0);
    inputRef.current?.blur();
  }

  function navigateTo(href: string) {
    closeSearch();
    router.push(href);
  }

  useEventListener("keydown", (e: KeyboardEvent) => {
    if (!enableShortcut) return;
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (isOpen) closeSearch();
      else openSearch();
    }
  });

  useEffect(() => {
    if (!isOpen) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (containerRef.current?.contains(target)) return;
      setIsOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [isOpen]);

  function onInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSearch();
      return;
    }

    if (!flatResults.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % flatResults.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        index <= 0 ? flatResults.length - 1 : index - 1
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const active = flatResults[activeIndex] ?? flatResults[0];
      if (active) navigateTo(active.href);
    }
  }

  const indexById = useMemo(() => {
    const map = new Map<string, number>();
    flatResults.forEach((row, index) => map.set(row.id, index));
    return map;
  }, [flatResults]);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {!isOpen ?
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={searchLabel}
          aria-haspopup="listbox"
          aria-expanded={false}
          onClick={openSearch}
          className={cn(
            "size-9 shrink-0 rounded-full border-border bg-surface-raised text-foreground shadow-none",
            "hover:bg-card hover:text-foreground",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "dark:bg-background dark:hover:bg-accent",
            "sm:hidden"
          )}
        >
          <Search aria-hidden className="size-4" />
        </Button>
      : null}

      <div
        className={cn(
          isOpen ?
            "fixed inset-x-0 top-0 z-[60] border-b border-border bg-card p-3 pt-[max(0.75rem,env(safe-area-inset-top))] shadow-dropdown sm:static sm:z-auto sm:border-0 sm:bg-transparent sm:p-0 sm:pt-0 sm:shadow-none"
          : "hidden sm:block"
        )}
      >
        <div className="relative mx-auto w-full max-w-[40rem] sm:max-w-none">
          <label htmlFor={inputId} className="sr-only">
            {searchLabel}
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--text-muted))]"
            aria-hidden
          />
          <Input
            ref={inputRef}
            id={inputId}
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={panelId}
            aria-autocomplete="list"
            aria-activedescendant={
              flatResults[activeIndex] ?
                `${panelId}-${flatResults[activeIndex]!.id}`
              : undefined
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={onInputKeyDown}
            placeholder={searchPlaceholder}
            className={cn(
              "h-11 w-full rounded-full border-border bg-surface-raised pl-9 pr-20 text-foreground shadow-none sm:h-9",
              "placeholder:text-[hsl(var(--text-muted))]",
              "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "dark:bg-background"
            )}
          />

          <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {query ?
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="flex size-8 items-center justify-center rounded-full text-[hsl(var(--text-muted))] transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-accent"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            : <kbd className="pointer-events-none hidden h-5 select-none items-center rounded border border-border bg-card px-1.5 font-mono text-[10px] font-medium text-[hsl(var(--text-muted))] md:inline-flex dark:bg-muted">
                <span className="text-[10px]">{shortcutKey}</span>K
              </kbd>
            }
            {isOpen ?
              <button
                type="button"
                aria-label="Close search"
                onClick={closeSearch}
                className="flex size-8 items-center justify-center rounded-full text-[hsl(var(--text-muted))] transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:hidden dark:hover:bg-accent"
              >
                <X className="size-4" aria-hidden />
              </button>
            : null}
          </div>
        </div>
      </div>

      {isOpen && mounted ?
        <>
          <button
            type="button"
            aria-label="Close search"
            className="fixed inset-0 z-[55] bg-background/40 sm:hidden"
            onClick={closeSearch}
          />
          <div
            id={panelId}
            role="listbox"
            aria-label={searchLabel}
            className={cn(
              "z-[60] overflow-hidden border border-border bg-card shadow-dropdown dark:bg-popover dark:shadow-md",
              "fixed inset-x-0 top-[calc(3.75rem+env(safe-area-inset-top,0px))] max-h-[min(70dvh,28rem)] sm:absolute sm:inset-x-0 sm:top-[calc(100%+0.5rem)] sm:max-h-[min(60vh,28rem)] sm:rounded-xl"
            )}
          >
            <div className="max-h-[inherit] overflow-y-auto p-2">
              {!debouncedQuery ?
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Search pages, songs, sermons, articles, events, and more.
                </p>
              : null}

              {showHint ?
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Type at least 2 characters to search.
                </p>
              : null}

              {queryReady && catalogLoading && !catalogLoaded && pageRows.length === 0 ?
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Searching…
                </div>
              : null}

              {queryReady && catalogLoading && !catalogLoaded && pageRows.length > 0 ?
                <div className="flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  Searching content…
                </div>
              : null}

              {showEmptyFinal ?
                <div className="space-y-1 px-3 py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No results found for &ldquo;{debouncedQuery}&rdquo;
                  </p>
                  <p className="text-xs text-[hsl(var(--text-muted))]">
                    Try searching for a song, sermon, article, event, or book.
                  </p>
                </div>
              : null}

              {groupedForRender.map((section) => (
                <section key={section.label} className="mb-2 last:mb-0">
                  <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {section.label}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {section.results.map((result) => {
                      const index = indexById.get(result.id) ?? 0;
                      const selected = index === activeIndex;
                      const Icon = result.icon;

                      if (result.kind === "page") {
                        return (
                          <button
                            key={result.id}
                            type="button"
                            id={`${panelId}-${result.id}`}
                            role="option"
                            aria-selected={selected}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => navigateTo(result.href)}
                            className={cn(
                              "flex min-h-11 w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                              selected ?
                                "bg-primary-subtle text-foreground"
                              : "hover:bg-surface-raised dark:hover:bg-accent"
                            )}
                          >
                            {Icon ?
                              <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground dark:bg-background">
                                <Icon className="size-4" aria-hidden />
                              </span>
                            : null}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">
                                {result.title}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {result.subtitle}
                              </span>
                            </span>
                          </button>
                        );
                      }

                      return (
                        <div
                          key={result.id}
                          id={`${panelId}-${result.id}`}
                          role="option"
                          aria-selected={selected}
                          onMouseEnter={() => setActiveIndex(index)}
                          className={cn(selected && "rounded-lg ring-2 ring-ring/40")}
                        >
                          <SearchResultRow
                            href={result.href}
                            title={result.title}
                            subtitle={result.subtitle}
                            coverUrl={result.coverUrl}
                            highlightQuery={debouncedQuery}
                            onNavigate={closeSearch}
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </>
      : null}
    </div>
  );
}
