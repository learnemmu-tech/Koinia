import type { FirebaseArticle } from "@/types/firebase-article";
import type { FirebaseSermon } from "@/types/firebase-sermon";
import type { FirebaseSong } from "@/types/firebase-song";

import type { WorshipCollectionTab } from "@/hooks/use-store";
import { getSongAlternateTitle, getSongDisplayTitle } from "@/lib/song-firestore";

export type WorshipSearchResultItem = {
  resultId: string;
  href: string;
  title: string;
  subtitle?: string;
  coverUrl?: string;
};

function getSermonSubtitle(sermon: FirebaseSermon): string | undefined {
  return sermon.shortDescription?.trim() || sermon.subtitle?.trim() || undefined;
}

type BuildWorshipSearchResultsArgs = {
  activeTab: WorshipCollectionTab;
  songs: FirebaseSong[];
  sermons: FirebaseSermon[];
  articles: FirebaseArticle[];
};

export function buildWorshipSearchResults({
  activeTab,
  songs,
  sermons,
  articles,
}: BuildWorshipSearchResultsArgs): WorshipSearchResultItem[] {
  if (activeTab === "songs") {
    return songs.map((song, index) => ({
      resultId: `search-song-${song.id || index}`,
      href: `/songs/${encodeURIComponent(song.id)}`,
      title: getSongDisplayTitle(song),
      subtitle: getSongAlternateTitle(song),
      coverUrl: song.imageUrl,
    }));
  }

  if (activeTab === "sermons") {
    return sermons.map((sermon, index) => ({
      resultId: `search-sermon-${sermon.id || index}`,
      href: `/sermons/${encodeURIComponent(sermon.id)}`,
      title: sermon.title,
      subtitle: getSermonSubtitle(sermon),
      coverUrl: sermon.coverImage,
    }));
  }

  return articles.map((article, index) => ({
    resultId: `search-article-${article.id || index}`,
    href: `/articles/${encodeURIComponent(article.id)}`,
    title: article.title,
    subtitle: article.shortDescription,
    coverUrl: article.coverImage,
  }));
}
