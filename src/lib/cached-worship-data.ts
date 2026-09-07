import { cache } from "react";

import { unstable_cache } from "next/cache";

import type { FirebaseArticle } from "@/types/firebase-article";
import type { FirebaseEvent } from "@/types/firebase-event";
import type { FirebaseSermon } from "@/types/firebase-sermon";
import type { FirebaseSong } from "@/types/firebase-song";

import { getArticleById, getPublishedArticles } from "./firebase-article-queries";
import { getPublishedEvents } from "./firebase-event-queries";
import { getSermonById, getPublishedSermons } from "./firebase-sermon-queries";
import { getPublishedSongs, getSongById } from "./firebase-queries";
import { toArticleListItem } from "./article-firestore";
import type { ContentQueryInput } from "@/lib/content/content-scope";
import {
  contentCacheKey,
  recordMatchesContentQuery,
} from "@/lib/content/content-scope";
import { toSermonListItem } from "./sermon-firestore";
import { toSongListItem } from "./song-firestore";

const REVALIDATE_SECONDS = 60;

function queryCacheKey(query: ContentQueryInput): string {
  return contentCacheKey(query);
}

export const getPublishedSongsCached = cache(async (
  query: ContentQueryInput,
  limit?: number
) => {
  const key = queryCacheKey(query);
  try {
    return await unstable_cache(
      async (): Promise<FirebaseSong[]> => {
        const songs = await getPublishedSongs(query, { limit });
        return songs.map(toSongListItem);
      },
      ["worship-published-songs", key, limit != null ? `limit-${limit}` : "all"],
      {
        revalidate: REVALIDATE_SECONDS,
        tags: ["worship-songs", `content-${key}`],
      }
    )();
  } catch (error) {
    console.error("[worship] Failed to load published songs:", error);
    return [];
  }
});

export const getPublishedSermonsCached = cache(async (
  query: ContentQueryInput,
  limit?: number
) => {
  const key = queryCacheKey(query);
  try {
    return await unstable_cache(
      async (): Promise<FirebaseSermon[]> => {
        const sermons = await getPublishedSermons(query, { limit });
        return sermons.map(toSermonListItem);
      },
      ["worship-published-sermons", key, limit != null ? `limit-${limit}` : "all"],
      {
        revalidate: REVALIDATE_SECONDS,
        tags: ["worship-sermons", `content-${key}`],
      }
    )();
  } catch (error) {
    console.error("[worship] Failed to load published sermons:", error);
    return [];
  }
});

export const getPublishedArticlesCached = cache(async (
  query: ContentQueryInput,
  limit?: number
) => {
  const key = queryCacheKey(query);
  try {
    return await unstable_cache(
      async (): Promise<FirebaseArticle[]> => {
        const articles = await getPublishedArticles(query, { limit });
        return articles.map(toArticleListItem);
      },
      ["worship-published-articles", key, limit != null ? `limit-${limit}` : "all"],
      {
        revalidate: REVALIDATE_SECONDS,
        tags: ["worship-articles", `content-${key}`],
      }
    )();
  } catch (error) {
    console.error("[worship] Failed to load published articles:", error);
    return [];
  }
});

export const getPublishedEventsCached = cache(async (
  query: ContentQueryInput,
  limit?: number
) => {
  const key = queryCacheKey(query);
  try {
    return await unstable_cache(
      async (): Promise<FirebaseEvent[]> => {
        return getPublishedEvents(query, { limit });
      },
      ["worship-published-events", key, limit != null ? `limit-${limit}` : "all"],
      { revalidate: REVALIDATE_SECONDS, tags: ["events", `content-${key}`] }
    )();
  } catch (error) {
    console.error("[worship] Failed to load published events:", error);
    return [];
  }
});

export const getSongByIdCached = cache(
  async (query: ContentQueryInput, songId: string) => {
    const key = queryCacheKey(query);
    return unstable_cache(
      async () => {
        const song = await getSongById(songId);
        if (!recordMatchesContentQuery(song, query)) {
          return null;
        }
        return song;
      },
      ["worship-song-by-id", key, songId],
      {
        revalidate: REVALIDATE_SECONDS,
        tags: [`worship-song-${songId}`, `content-${key}`],
      }
    )();
  }
);

export const getSermonByIdCached = cache(
  async (query: ContentQueryInput, sermonId: string) => {
    const key = queryCacheKey(query);
    return unstable_cache(
      async () => {
        const sermon = await getSermonById(sermonId);
        if (!recordMatchesContentQuery(sermon, query)) {
          return null;
        }
        return sermon;
      },
      ["worship-sermon-by-id", key, sermonId],
      {
        revalidate: REVALIDATE_SECONDS,
        tags: [`worship-sermon-${sermonId}`, `content-${key}`],
      }
    )();
  }
);

export const getArticleByIdCached = cache(
  async (query: ContentQueryInput, articleId: string) => {
    const key = queryCacheKey(query);
    return unstable_cache(
      async () => {
        const article = await getArticleById(articleId);
        if (!recordMatchesContentQuery(article, query)) {
          return null;
        }
        return article;
      },
      ["worship-article-by-id", key, articleId],
      {
        revalidate: REVALIDATE_SECONDS,
        tags: [`worship-article-${articleId}`, `content-${key}`],
      }
    )();
  }
);

export type WorshipCatalog = {
  songs: FirebaseSong[];
  sermons: FirebaseSermon[];
  articles: FirebaseArticle[];
  events: FirebaseEvent[];
};

const HOME_PREVIEW_LIMIT = 6;
const HOME_EVENT_PREVIEW_LIMIT = 12;

export const getWorshipCatalogCached = cache(
  async (query: ContentQueryInput): Promise<WorshipCatalog> => {
    const [songs, sermons, articles, events] = await Promise.all([
      getPublishedSongsCached(query, HOME_PREVIEW_LIMIT),
      getPublishedSermonsCached(query, HOME_PREVIEW_LIMIT),
      getPublishedArticlesCached(query, HOME_PREVIEW_LIMIT),
      getPublishedEventsCached(query, HOME_EVENT_PREVIEW_LIMIT),
    ]);
    return { songs, sermons, articles, events };
  }
);
