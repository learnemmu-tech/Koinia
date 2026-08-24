"use client";

import { useMemo, useState } from "react";

import type { FirebaseSong } from "@/types/firebase-song";

import { FirebaseSongCard, songsPageGridClassName } from "@/components/music/firebase-song-card";
import { ContentListToolbar } from "@/components/worship/content-list-toolbar";
import { SongsTabHeader } from "@/components/worship/songs-tab-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ContentLoadMore } from "@/components/ui/content-load-more";
import { WorkspaceChurchRequiredNotice } from "@/components/workspace/workspace-church-required-notice";
import { useContentTenantScope } from "@/hooks/use-workspace-tenant-scope";
import { useRealtimeSongs } from "@/hooks/use-worship-realtime";
import {
  filterPublishedSongs,
  getSongAlternateTitle,
  getSongDisplayTitle,
} from "@/lib/song-firestore";
import { SONG_CATEGORIES } from "@/types/firebase-song";

function SongsPageGridSkeleton() {
  return (
    <div className={songsPageGridClassName}>
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="space-y-3 rounded-lg p-2.5">
          <Skeleton className="aspect-square w-full rounded-md" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

type SongsTabContentProps = {
  initialSongs: FirebaseSong[];
};

export function SongsTabContent({ initialSongs }: SongsTabContentProps) {
  const scope = useContentTenantScope();
  const { data: songs, syncing, loadMore, hasMore, loadingMore } =
    useRealtimeSongs(initialSongs);
  const visibleSongs = useMemo(() => filterPublishedSongs(songs), [songs]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");

  const filteredSongs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return visibleSongs.filter((song) => {
      if (category !== "all" && song.category !== category) return false;
      if (!query) return true;
      const haystack = [
        getSongDisplayTitle(song),
        getSongAlternateTitle(song),
        song.artist,
        song.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [visibleSongs, search, category]);

  if (scope.blocked) {
    return <WorkspaceChurchRequiredNotice />;
  }

  if (syncing && visibleSongs.length === 0) {
    return <SongsPageGridSkeleton />;
  }

  if (visibleSongs.length === 0) {
    return <TabEmptyState message="No songs available yet." />;
  }

  return (
    <div className="space-y-4">
      <ContentListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search songs…"
      >
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full min-w-0 sm:w-[10rem] rounded-full">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {SONG_CATEGORIES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ContentListToolbar>

      <SongsTabHeader count={filteredSongs.length} />

      {filteredSongs.length === 0 ?
        <TabEmptyState message="No songs match your search." />
      : <div className={songsPageGridClassName}>
          {filteredSongs.map((song) => (
            <FirebaseSongCard key={song.id} song={song} />
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

export function TabEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 px-6 py-16 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
