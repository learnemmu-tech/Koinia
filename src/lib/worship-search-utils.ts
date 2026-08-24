import type { FirebaseArticle } from "@/types/firebase-article";
import type { FirebaseEvent } from "@/types/firebase-event";
import type { FirebaseSermon } from "@/types/firebase-sermon";
import type { FirebaseSong } from "@/types/firebase-song";

import { getSongDisplayTitle } from "./song-firestore";

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function filterSongsLocal(
  songs: FirebaseSong[],
  searchQuery: string
): FirebaseSong[] {
  const normalized = normalizeQuery(searchQuery);
  if (!normalized) return [];

  return songs.filter((song) => {
    const haystack = [
      song.songTitle,
      song.alternateTitle ?? "",
      song.artist ?? "",
      song.category,
      song.scriptureReference ?? "",
      ...song.tags,
      song.title,
      song.englishTitle ?? "",
      song.teluguTitle ?? "",
      getSongDisplayTitle(song),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

export function filterSermonsLocal(
  sermons: FirebaseSermon[],
  searchQuery: string
): FirebaseSermon[] {
  const normalized = normalizeQuery(searchQuery);
  if (!normalized) return [];

  return sermons.filter((sermon) => {
    const haystack = [
      sermon.title,
      sermon.speaker,
      sermon.scriptureReference,
      sermon.shortDescription,
      ...sermon.tags,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

export function filterArticlesLocal(
  articles: FirebaseArticle[],
  searchQuery: string
): FirebaseArticle[] {
  const normalized = normalizeQuery(searchQuery);
  if (!normalized) return [];

  return articles.filter((article) => {
    const haystack = [
      article.title,
      article.category,
      article.author,
      article.scriptureReference ?? "",
      article.shortDescription,
      ...article.tags,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

export function filterEventsLocal(
  events: FirebaseEvent[],
  searchQuery: string
): FirebaseEvent[] {
  const normalized = normalizeQuery(searchQuery);
  if (!normalized) return [];

  return events.filter((event) => {
    const haystack = [
      event.title,
      event.description,
      event.eventType,
      event.speakerName,
      event.location,
      event.eventDate,
      event.eventTime,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}
