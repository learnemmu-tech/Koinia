"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";

import { useWorshipCatalog } from "@/context/worship-catalog-context";
import {
  buildGlobalSearchResults,
  toGlobalSearchSections,
} from "@/lib/global-search";
import {
  filterArticlesLocal,
  filterEventsLocal,
  filterSermonsLocal,
  filterSongsLocal,
} from "@/lib/worship-search-utils";

import { SearchResultRow } from "./search-result-row";

type GlobalSearchResultsProps = {
  query: string;
  isLoading?: boolean;
};

export function GlobalSearchResults({
  query,
  isLoading = false,
}: GlobalSearchResultsProps) {
  const catalog = useWorshipCatalog();

  const sections = useMemo(() => {
    if (!catalog || !query.trim()) return [];

    const grouped = buildGlobalSearchResults({
      songs: filterSongsLocal(catalog.songs, query),
      sermons: filterSermonsLocal(catalog.sermons, query),
      articles: filterArticlesLocal(catalog.articles, query),
      events: filterEventsLocal(catalog.events, query),
    });

    return toGlobalSearchSections(grouped);
  }, [catalog, query]);

  if (!query.trim()) return null;

  if (isLoading || !catalog) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Searching...
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No results found for &ldquo;{query}&rdquo;
      </div>
    );
  }

  return (
    <div className="flex max-h-[min(calc(100dvh-6rem),28rem)] w-full flex-col gap-5 overflow-y-auto py-4 pr-2 sm:max-h-[min(60vh,28rem)]">
      {sections.map((section) => (
        <section key={section.label} className="space-y-2">
          <p className="font-heading text-base font-semibold">{section.label}</p>
          <div className="flex flex-col gap-2">
            {section.results.map((result, index) => (
              <SearchResultRow
                key={result.resultId || `global-search-${section.label}-${index}`}
                href={result.href}
                title={result.title}
                subtitle={result.subtitle}
                coverUrl={result.coverUrl}
                highlightQuery={query}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
