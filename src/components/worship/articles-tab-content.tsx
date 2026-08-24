"use client";

import { useMemo, useState } from "react";

import type { FirebaseArticle } from "@/types/firebase-article";

import { FirebaseArticleCard } from "@/components/worship/firebase-article-card";
import { CollectionTabHeader } from "@/components/worship/collection-tab-header";
import { ContentListToolbar } from "@/components/worship/content-list-toolbar";
import { worshipContentGridClassName } from "@/components/worship/worship-card-styles";
import { TabEmptyState } from "@/components/worship/songs-tab-content";
import { WorshipGridSkeleton } from "@/components/skeletons/worship-grid-skeleton";
import { ContentLoadMore } from "@/components/ui/content-load-more";
import { useRealtimeArticles } from "@/hooks/use-worship-realtime";

type ArticlesTabContentProps = {
  initialArticles: FirebaseArticle[];
};

export function ArticlesTabContent({ initialArticles }: ArticlesTabContentProps) {
  const { data: liveArticles, syncing, loadMore, hasMore, loadingMore } =
    useRealtimeArticles(initialArticles);
  const articles = useMemo(
    () => liveArticles.filter((article) => article.isPublished),
    [liveArticles]
  );
  const [search, setSearch] = useState("");

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return articles;
    return articles.filter((article) => {
      const haystack = [article.title, article.author, article.shortDescription]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [articles, search]);

  if (syncing && articles.length === 0) {
    return <WorshipGridSkeleton />;
  }

  if (articles.length === 0) {
    return <TabEmptyState message="No Articles Found" />;
  }

  return (
    <div className="space-y-4">
      <ContentListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search articles…"
      />

      <CollectionTabHeader title="Articles" count={filteredArticles.length} />

      {filteredArticles.length === 0 ?
        <TabEmptyState message="No articles match your search." />
      : <div className={worshipContentGridClassName}>
          {filteredArticles.map((article) => (
            <FirebaseArticleCard key={article.id} article={article} />
          ))}
        </div>
      }

      <ContentLoadMore
        hasMore={hasMore}
        loading={loadingMore}
        onLoadMore={loadMore}
      />
    </div>
  );
}
