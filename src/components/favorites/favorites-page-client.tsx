"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";

import { EventCard } from "@/components/events/event-card";
import { FirebaseArticleCard } from "@/components/worship/firebase-article-card";
import { FirebaseSermonCard } from "@/components/worship/firebase-sermon-card";
import {
  FirebaseSongCard,
  songsAlbumGridClassName,
} from "@/components/music/firebase-song-card";
import { WorshipGridSkeleton } from "@/components/skeletons/worship-grid-skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FetchErrorBanner } from "@/components/ui/fetch-error-banner";
import { useFavorites } from "@/context/favorites-context";
import {
  useResolvedFavoriteItems,
  type ResolvedFavoriteEntry,
} from "@/hooks/use-resolved-favorite-items";
import {
  contentCardGridClassName,
  pageContentClass,
  typePageTitleClass,
} from "@/lib/responsive-classes";

type FilterTab = "all" | "sermons" | "songs" | "articles" | "events";

export function FavoritesPageClient() {
  const { favorites, loading: favoritesLoading } = useFavorites();
  const {
    songs,
    sermons,
    articles,
    events,
    entries,
    loading: itemsLoading,
    error: itemsError,
  } = useResolvedFavoriteItems(favorites);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const loading = favoritesLoading || itemsLoading;
  const savedCount = favorites.length;
  const visibleCount = entries.length;

  const filteredEntries = useMemo(() => {
    if (activeTab === "all") return entries;
    const typeMap = {
      songs: "song",
      sermons: "sermon",
      articles: "article",
      events: "event",
    } as const;
    const itemType = typeMap[activeTab];
    return entries.filter((entry) => entry.itemType === itemType);
  }, [activeTab, entries]);

  return (
    <div className={pageContentClass}>
      <div className="space-y-2">
        <h1 className={typePageTitleClass}>My Library</h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Everything you have saved in one place.
        </p>
      </div>

      {itemsError ?
        <FetchErrorBanner message={itemsError} />
      : null}

      {loading ?
        <WorshipGridSkeleton count={8} />
      : savedCount === 0 ?
        <LibraryEmptyState />
      : <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as FilterTab)}
          className="space-y-6"
        >
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl border border-border/50 bg-muted/50 p-1 sm:max-w-3xl sm:grid-cols-5">
            <TabsTrigger value="all" className="rounded-lg text-xs sm:text-sm">
              All ({visibleCount})
            </TabsTrigger>
            <TabsTrigger value="sermons" className="rounded-lg text-xs sm:text-sm">
              Sermons ({sermons.length})
            </TabsTrigger>
            <TabsTrigger value="songs" className="rounded-lg text-xs sm:text-sm">
              Songs ({songs.length})
            </TabsTrigger>
            <TabsTrigger value="articles" className="rounded-lg text-xs sm:text-sm">
              Articles ({articles.length})
            </TabsTrigger>
            <TabsTrigger value="events" className="rounded-lg text-xs sm:text-sm">
              Events ({events.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <FavoriteEntryGrid
              entries={filteredEntries}
              emptyMessage="No saved items are available right now. Some items may be from another church you no longer have access to."
            />
          </TabsContent>

          <TabsContent value="songs" className="mt-0">
            <FavoriteEntryGrid
              entries={filteredEntries}
              emptyMessage="No songs saved yet. Browse songs and tap the heart icon to save them here."
              browseHref="/songs"
              browseLabel="Browse Songs"
            />
          </TabsContent>

          <TabsContent value="sermons" className="mt-0">
            <FavoriteEntryGrid
              entries={filteredEntries}
              emptyMessage="No sermons saved yet. Browse sermons and tap the heart icon to save them here."
              browseHref="/sermons"
              browseLabel="Browse Sermons"
            />
          </TabsContent>

          <TabsContent value="articles" className="mt-0">
            <FavoriteEntryGrid
              entries={filteredEntries}
              emptyMessage="No articles saved yet. Browse articles and tap the heart icon to save them here."
              browseHref="/articles"
              browseLabel="Browse Articles"
            />
          </TabsContent>

          <TabsContent value="events" className="mt-0">
            <FavoriteEntryGrid
              entries={filteredEntries}
              emptyMessage="No events saved yet. Browse events and tap the heart icon to save them here."
              browseHref="/events"
              browseLabel="Browse Events"
            />
          </TabsContent>
        </Tabs>
      }
    </div>
  );
}

function FavoriteEntryGrid({
  entries,
  emptyMessage,
  browseHref,
  browseLabel,
}: {
  entries: ResolvedFavoriteEntry[];
  emptyMessage: string;
  browseHref?: string;
  browseLabel?: string;
}) {
  if (entries.length === 0) {
    return (
      <TabEmptyState
        message={emptyMessage}
        browseHref={browseHref}
        browseLabel={browseLabel}
      />
    );
  }

  const songsOnly = entries.every((entry) => entry.itemType === "song");
  const gridClass = songsOnly ? songsAlbumGridClassName : contentCardGridClassName;

  return (
    <div className={gridClass}>
      {entries.map((entry) => (
        <FavoriteEntryCard key={`${entry.itemType}:${entry.item.id}`} entry={entry} />
      ))}
    </div>
  );
}

function FavoriteEntryCard({ entry }: { entry: ResolvedFavoriteEntry }) {
  switch (entry.itemType) {
    case "song":
      return <FirebaseSongCard song={entry.item} />;
    case "sermon":
      return <FirebaseSermonCard sermon={entry.item} />;
    case "article":
      return <FirebaseArticleCard article={entry.item} />;
    case "event":
      return <EventCard event={entry.item} />;
  }
}

function LibraryEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-16 text-center">
      <Bookmark className="mx-auto size-10 text-muted-foreground/60" />
      <p className="mt-4 text-lg font-semibold text-foreground">
        Your library is empty
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Save sermons, songs, articles, and events to read or listen later.
      </p>
      <Button asChild className="mt-6 rounded-full" variant="outline">
        <Link href="/songs">Browse Content</Link>
      </Button>
    </div>
  );
}

function TabEmptyState({
  message,
  browseHref,
  browseLabel,
}: {
  message: string;
  browseHref?: string;
  browseLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 px-6 py-12 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      {browseHref && browseLabel ?
        <Button asChild className="mt-4 rounded-full" variant="outline" size="sm">
          <Link href={browseHref}>{browseLabel}</Link>
        </Button>
      : null}
    </div>
  );
}
