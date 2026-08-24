"use client";

import { useEffect, useMemo, useState } from "react";

import type { FirebaseArticle } from "@/types/firebase-article";
import type { FirebaseRecentlyViewed } from "@/types/firebase-recently-viewed";
import type { FirebaseSermon } from "@/types/firebase-sermon";
import type { FirebaseSong } from "@/types/firebase-song";

import { normalizeArticleFromFirestore } from "@/lib/article-firestore";
import { getFirestoreDocsByIds } from "@/lib/firestore-batch-get";
import { normalizeSermonFromFirestore } from "@/lib/sermon-firestore";
import {
  filterPublishedSongs,
  normalizeSongFromFirestore,
} from "@/lib/song-firestore";

export type ResolvedRecentlyViewedItem =
  | {
      entryId: string;
      itemType: "song";
      item: FirebaseSong;
      viewedAt: number;
    }
  | {
      entryId: string;
      itemType: "sermon";
      item: FirebaseSermon;
      viewedAt: number;
    }
  | {
      entryId: string;
      itemType: "article";
      item: FirebaseArticle;
      viewedAt: number;
    };

type ResolvedRecentlyViewedItems = {
  items: ResolvedRecentlyViewedItem[];
  loading: boolean;
  error: string | null;
};

export function useResolvedRecentlyViewedItems(
  recentlyViewed: FirebaseRecentlyViewed[]
): ResolvedRecentlyViewedItems {
  const [items, setItems] = useState<ResolvedRecentlyViewedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recentlyViewedKey = useMemo(
    () =>
      recentlyViewed
        .map((entry) => `${entry.itemType}:${entry.itemId}:${entry.viewedAt}`)
        .join("|"),
    [recentlyViewed]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      if (recentlyViewed.length === 0) {
        setItems([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const songIds = recentlyViewed
          .filter((entry) => entry.itemType === "song")
          .map((entry) => entry.itemId);
        const sermonIds = recentlyViewed
          .filter((entry) => entry.itemType === "sermon")
          .map((entry) => entry.itemId);
        const articleIds = recentlyViewed
          .filter((entry) => entry.itemType === "article")
          .map((entry) => entry.itemId);

        const [songs, sermons, articles] = await Promise.all([
          getFirestoreDocsByIds("songs", songIds, normalizeSongFromFirestore),
          getFirestoreDocsByIds("sermons", sermonIds, normalizeSermonFromFirestore),
          getFirestoreDocsByIds("articles", articleIds, normalizeArticleFromFirestore),
        ]);

        if (cancelled) return;

        const songMap = new Map(
          filterPublishedSongs(songs).map((song) => [song.id, song])
        );
        const sermonMap = new Map(
          sermons
            .filter((sermon) => sermon.isPublished)
            .map((sermon) => [sermon.id, sermon])
        );
        const articleMap = new Map(
          articles
            .filter((article) => article.isPublished)
            .map((article) => [article.id, article])
        );

        const resolved = recentlyViewed
          .map((entry) => resolveEntry(entry, songMap, sermonMap, articleMap))
          .filter((entry): entry is ResolvedRecentlyViewedItem => entry !== null);

        setItems(resolved);
      } catch {
        if (!cancelled) {
          setError("Unable to load recently viewed items. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadItems();

    return () => {
      cancelled = true;
    };
  }, [recentlyViewedKey, recentlyViewed]);

  return { items, loading, error };
}

function resolveEntry(
  entry: FirebaseRecentlyViewed,
  songMap: Map<string, FirebaseSong>,
  sermonMap: Map<string, FirebaseSermon>,
  articleMap: Map<string, FirebaseArticle>
): ResolvedRecentlyViewedItem | null {
  switch (entry.itemType) {
    case "song": {
      const item = songMap.get(entry.itemId);
      return item ?
          { entryId: entry.id, itemType: "song", item, viewedAt: entry.viewedAt }
        : null;
    }
    case "sermon": {
      const item = sermonMap.get(entry.itemId);
      return item ?
          { entryId: entry.id, itemType: "sermon", item, viewedAt: entry.viewedAt }
        : null;
    }
    case "article": {
      const item = articleMap.get(entry.itemId);
      return item ?
          { entryId: entry.id, itemType: "article", item, viewedAt: entry.viewedAt }
        : null;
    }
  }
}
