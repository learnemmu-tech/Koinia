"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import type { FirebaseSong } from "@/types/firebase-song";

import { FirebaseSongCard, songsPageGridClassName } from "@/components/music/firebase-song-card";
import { ContentAreaLoading } from "@/components/content-area-loading";
import { ContentListToolbar } from "@/components/worship/content-list-toolbar";
import { SongsTabHeader } from "@/components/worship/songs-tab-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type SongsTabContentProps = {
  initialSongs: FirebaseSong[];
  isPlatformPublic?: boolean;
};

export function SongsTabContent({
  initialSongs,
  isPlatformPublic = false,
}: SongsTabContentProps) {
  const scope = useContentTenantScope();
  const { data: songs, syncing, loadMore, hasMore, loadingMore } =
    useRealtimeSongs(initialSongs, { clientSync: !isPlatformPublic });
  const visibleSongs = useMemo(() => filterPublishedSongs(songs), [songs]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const t = useTranslations("songs");

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

  if (!isPlatformPublic && scope.blocked) {
    return <WorkspaceChurchRequiredNotice />;
  }

  if (syncing && visibleSongs.length === 0) {
    return <ContentAreaLoading />;
  }

  if (visibleSongs.length === 0) {
    return <TabEmptyState message={t("empty")} />;
  }

  return (
    <div className="space-y-4">
      <ContentListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("searchPlaceholder")}
      >
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full min-w-0 sm:w-[10rem] rounded-full">
            <SelectValue placeholder={t("category")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allCategories")}</SelectItem>
            {SONG_CATEGORIES.map((item) => (
              <SelectItem key={item} value={item}>
                {t(`categories.${item}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ContentListToolbar>

      <SongsTabHeader count={filteredSongs.length} />

      {filteredSongs.length === 0 ?
        <TabEmptyState message={t("noMatch")} />
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
