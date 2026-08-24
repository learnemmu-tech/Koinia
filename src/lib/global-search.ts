import type { FirebaseArticle } from "@/types/firebase-article";
import type { FirebaseEvent } from "@/types/firebase-event";
import type { FirebaseSermon } from "@/types/firebase-sermon";
import type { FirebaseSong } from "@/types/firebase-song";

import { formatEventDateTime } from "./event-firestore";
import { getSongAlternateTitle, getSongDisplayTitle } from "./song-firestore";

export type GlobalSearchResultItem = {
  resultId: string;
  href: string;
  title: string;
  subtitle?: string;
  coverUrl?: string;
};

export type GlobalSearchSection = {
  label: string;
  results: GlobalSearchResultItem[];
};

export type GlobalSearchGroupedResults = {
  songs: GlobalSearchResultItem[];
  sermons: GlobalSearchResultItem[];
  articles: GlobalSearchResultItem[];
  events: GlobalSearchResultItem[];
};

function getSermonSubtitle(sermon: FirebaseSermon): string | undefined {
  return sermon.shortDescription?.trim() || sermon.subtitle?.trim() || undefined;
}

function getEventSubtitle(event: FirebaseEvent): string | undefined {
  const dateTime = formatEventDateTime(event);
  const location = event.location.trim();
  if (dateTime && location) return `${dateTime} · ${location}`;
  return dateTime || location || event.eventType || undefined;
}

export function buildGlobalSearchResults(input: {
  songs: FirebaseSong[];
  sermons: FirebaseSermon[];
  articles: FirebaseArticle[];
  events: FirebaseEvent[];
}): GlobalSearchGroupedResults {
  return {
    songs: input.songs.map((song, index) => ({
      resultId: `search-song-${song.id || index}`,
      href: `/songs/${encodeURIComponent(song.id)}`,
      title: getSongDisplayTitle(song),
      subtitle: getSongAlternateTitle(song),
      coverUrl: song.imageUrl,
    })),
    sermons: input.sermons.map((sermon, index) => ({
      resultId: `search-sermon-${sermon.id || index}`,
      href: `/sermons/${encodeURIComponent(sermon.id)}`,
      title: sermon.title,
      subtitle: getSermonSubtitle(sermon),
      coverUrl: sermon.coverImage,
    })),
    articles: input.articles.map((article, index) => ({
      resultId: `search-article-${article.id || index}`,
      href: `/articles/${encodeURIComponent(article.id)}`,
      title: article.title,
      subtitle: article.shortDescription,
      coverUrl: article.coverImage,
    })),
    events: input.events.map((event, index) => ({
      resultId: `search-event-${event.id || index}`,
      href: `/events/${encodeURIComponent(event.id)}`,
      title: event.title,
      subtitle: getEventSubtitle(event),
      coverUrl: event.bannerImage,
    })),
  };
}

export function toGlobalSearchSections(
  grouped: GlobalSearchGroupedResults
): GlobalSearchSection[] {
  return [
    { label: "Songs", results: grouped.songs },
    { label: "Sermons", results: grouped.sermons },
    { label: "Articles", results: grouped.articles },
    { label: "Events", results: grouped.events },
  ].filter((section) => section.results.length > 0);
}
