"use client";

import { useEffect, useMemo, useState } from "react";

import type { FirebaseArticle } from "@/types/firebase-article";
import type { FirebaseEvent } from "@/types/firebase-event";
import type { FirebaseFavorite } from "@/types/firebase-favorite";
import type { FirebaseSermon } from "@/types/firebase-sermon";
import type { FirebaseSong } from "@/types/firebase-song";

import { normalizeArticleFromFirestore } from "@/lib/article-firestore";
import {
  getFirestoreDocsByIdsSafe,
} from "@/lib/firestore-batch-get";
import { normalizeEventFromFirestore } from "@/lib/event-firestore";
import { normalizeSermonFromFirestore } from "@/lib/sermon-firestore";
import { filterPublishedSongs, normalizeSongFromFirestore } from "@/lib/song-firestore";

export type ResolvedFavoriteEntry =
  | { itemType: "song"; favorite: FirebaseFavorite; item: FirebaseSong }
  | { itemType: "sermon"; favorite: FirebaseFavorite; item: FirebaseSermon }
  | { itemType: "article"; favorite: FirebaseFavorite; item: FirebaseArticle }
  | { itemType: "event"; favorite: FirebaseFavorite; item: FirebaseEvent };

type ResolvedFavoriteItems = {
  songs: FirebaseSong[];
  sermons: FirebaseSermon[];
  articles: FirebaseArticle[];
  events: FirebaseEvent[];
  entries: ResolvedFavoriteEntry[];
  loading: boolean;
  error: string | null;
};

export function useResolvedFavoriteItems(
  favorites: FirebaseFavorite[]
): ResolvedFavoriteItems {
  const [songs, setSongs] = useState<FirebaseSong[]>([]);
  const [sermons, setSermons] = useState<FirebaseSermon[]>([]);
  const [articles, setArticles] = useState<FirebaseArticle[]>([]);
  const [events, setEvents] = useState<FirebaseEvent[]>([]);
  const [entries, setEntries] = useState<ResolvedFavoriteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const favoriteKey = useMemo(
    () =>
      favorites
        .map((favorite) => `${favorite.itemType}:${favorite.itemId}`)
        .join("|"),
    [favorites]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      if (favorites.length === 0) {
        setSongs([]);
        setSermons([]);
        setArticles([]);
        setEvents([]);
        setEntries([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [nextSongs, nextSermons, nextArticles, nextEvents] =
          await Promise.all([
            loadSongs(favorites),
            loadSermons(favorites),
            loadArticles(favorites),
            loadEvents(favorites),
          ]);

        if (cancelled) return;

        const songMap = new Map(nextSongs.map((item) => [item.id, item]));
        const sermonMap = new Map(nextSermons.map((item) => [item.id, item]));
        const articleMap = new Map(nextArticles.map((item) => [item.id, item]));
        const eventMap = new Map(nextEvents.map((item) => [item.id, item]));

        const nextEntries: ResolvedFavoriteEntry[] = [];

        for (const favorite of favorites) {
          if (favorite.itemType === "song") {
            const item = songMap.get(favorite.itemId);
            if (item) nextEntries.push({ itemType: "song", favorite, item });
            continue;
          }
          if (favorite.itemType === "sermon") {
            const item = sermonMap.get(favorite.itemId);
            if (item) nextEntries.push({ itemType: "sermon", favorite, item });
            continue;
          }
          if (favorite.itemType === "article") {
            const item = articleMap.get(favorite.itemId);
            if (item) nextEntries.push({ itemType: "article", favorite, item });
            continue;
          }
          if (favorite.itemType === "event") {
            const item = eventMap.get(favorite.itemId);
            if (item) nextEntries.push({ itemType: "event", favorite, item });
          }
        }

        setSongs(nextSongs);
        setSermons(nextSermons);
        setArticles(nextArticles);
        setEvents(nextEvents);
        setEntries(nextEntries);
      } catch {
        if (!cancelled) {
          setError("Unable to load your library. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadItems();

    return () => {
      cancelled = true;
    };
  }, [favoriteKey, favorites]);

  return { songs, sermons, articles, events, entries, loading, error };
}

async function loadSongs(favorites: FirebaseFavorite[]): Promise<FirebaseSong[]> {
  const ids = favorites
    .filter((favorite) => favorite.itemType === "song")
    .map((favorite) => favorite.itemId);

  const songs = await getFirestoreDocsByIdsSafe(
    "songs",
    ids,
    normalizeSongFromFirestore
  );
  return filterPublishedSongs(songs);
}

async function loadSermons(
  favorites: FirebaseFavorite[]
): Promise<FirebaseSermon[]> {
  const ids = favorites
    .filter((favorite) => favorite.itemType === "sermon")
    .map((favorite) => favorite.itemId);

  const sermons = await getFirestoreDocsByIdsSafe(
    "sermons",
    ids,
    normalizeSermonFromFirestore
  );

  return sermons.filter((sermon) => sermon.isPublished);
}

async function loadArticles(
  favorites: FirebaseFavorite[]
): Promise<FirebaseArticle[]> {
  const ids = favorites
    .filter((favorite) => favorite.itemType === "article")
    .map((favorite) => favorite.itemId);

  const articles = await getFirestoreDocsByIdsSafe(
    "articles",
    ids,
    normalizeArticleFromFirestore
  );

  return articles.filter((article) => article.isPublished);
}

async function loadEvents(
  favorites: FirebaseFavorite[]
): Promise<FirebaseEvent[]> {
  const ids = favorites
    .filter((favorite) => favorite.itemType === "event")
    .map((favorite) => favorite.itemId);

  const events = await getFirestoreDocsByIdsSafe(
    "events",
    ids,
    normalizeEventFromFirestore
  );

  return events.filter((event) => event.status === "published");
}
