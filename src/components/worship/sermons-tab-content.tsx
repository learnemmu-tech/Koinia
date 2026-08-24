"use client";

import { useMemo, useState } from "react";

import type { FirebaseSermon } from "@/types/firebase-sermon";

import { FirebaseSermonCard } from "@/components/worship/firebase-sermon-card";
import { CollectionTabHeader } from "@/components/worship/collection-tab-header";
import { ContentListToolbar } from "@/components/worship/content-list-toolbar";
import { worshipContentGridClassName } from "@/components/worship/worship-card-styles";
import { TabEmptyState } from "@/components/worship/songs-tab-content";
import { WorshipGridSkeleton } from "@/components/skeletons/worship-grid-skeleton";
import { ContentLoadMore } from "@/components/ui/content-load-more";
import { useRealtimeSermons } from "@/hooks/use-worship-realtime";

type SermonsTabContentProps = {
  initialSermons: FirebaseSermon[];
};

export function SermonsTabContent({ initialSermons }: SermonsTabContentProps) {
  const { data: liveSermons, syncing, loadMore, hasMore, loadingMore } =
    useRealtimeSermons(initialSermons);
  const sermons = useMemo(
    () => liveSermons.filter((sermon) => sermon.isPublished),
    [liveSermons]
  );
  const [search, setSearch] = useState("");

  const filteredSermons = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sermons;
    return sermons.filter((sermon) => {
      const haystack = [
        sermon.title,
        sermon.speaker,
        sermon.scriptureReference,
        sermon.shortDescription,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [sermons, search]);

  if (syncing && sermons.length === 0) {
    return <WorshipGridSkeleton />;
  }

  if (sermons.length === 0) {
    return <TabEmptyState message="No Sermons Found" />;
  }

  return (
    <div className="space-y-4">
      <ContentListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search sermons…"
      />

      <CollectionTabHeader title="Sermons" count={filteredSermons.length} />

      {filteredSermons.length === 0 ?
        <TabEmptyState message="No sermons match your search." />
      : <div className={worshipContentGridClassName}>
          {filteredSermons.map((sermon) => (
            <FirebaseSermonCard key={sermon.id} sermon={sermon} />
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
