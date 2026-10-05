"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import type { ChurchVideo } from "@/types/church-video";
import { ChurchVideoCard } from "@/components/videos/church-video-card";
import { TabEmptyState } from "@/components/worship/songs-tab-content";
import { ContentListToolbar } from "@/components/worship/content-list-toolbar";
import { contentCardGridClassName } from "@/lib/responsive-classes";

export function HeritageVideosList({ videos }: { videos: ChurchVideo[] }) {
  const t = useTranslations("heritage.pages");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return videos;
    return videos.filter((video) => {
      const haystack = [video.title, video.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [videos, search]);

  if (videos.length === 0) {
    return <TabEmptyState message={t("noVideos")} />;
  }

  return (
    <div className="space-y-4">
      <ContentListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("searchVideos")}
      />
      {filtered.length === 0 ? (
        <TabEmptyState message={t("noVideoMatch")} />
      ) : (
        <div className={contentCardGridClassName}>
          {filtered.map((video) => (
            <ChurchVideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
