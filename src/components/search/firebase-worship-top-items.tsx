"use client";

import { useMemo } from "react";

import type { FirebaseArticle } from "@/types/firebase-article";
import type { FirebaseSermon } from "@/types/firebase-sermon";
import type { FirebaseSong } from "@/types/firebase-song";

import { useEffectiveWorshipCollectionTab } from "@/hooks/use-effective-worship-collection-tab";

import { SearchResultRow } from "./search-result-row";
import { buildWorshipSearchResults } from "./worship-search-result-list";

type WorshipTopItemsClientProps = {
  songs: FirebaseSong[];
  sermons: FirebaseSermon[];
  articles: FirebaseArticle[];
};

export function WorshipTopItemsClient({
  songs,
  sermons,
  articles,
}: WorshipTopItemsClientProps) {
  const { activeTab } = useEffectiveWorshipCollectionTab();

  const results = useMemo(
    () =>
      buildWorshipSearchResults({
        activeTab,
        songs,
        sermons,
        articles,
      }),
    [activeTab, songs, sermons, articles]
  );

  const sectionLabel =
    activeTab === "songs"
      ? "Popular Songs"
      : activeTab === "sermons"
        ? "Recent Sermons"
        : "Recent Articles";

  if (results.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-muted-foreground">
        {activeTab === "songs"
          ? "No songs yet"
          : activeTab === "sermons"
            ? "No sermons yet"
            : "No articles yet"}
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 py-4">
      <p className="font-heading text-lg font-semibold">{sectionLabel}</p>
      <div className="flex max-h-96 w-full flex-col gap-2 overflow-y-auto pr-2">
        {results.map((result, index) => (
          <SearchResultRow
            key={result.resultId || `worship-top-${index}`}
            href={result.href}
            title={result.title}
            subtitle={result.subtitle}
            coverUrl={result.coverUrl}
          />
        ))}
      </div>
    </div>
  );
}
