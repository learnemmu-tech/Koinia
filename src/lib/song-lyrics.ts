import type { FirebaseSong } from "@/types/firebase-song";

export type SongLyricsContent = {
  /** English lyrics — first tab */
  english: string;
  /** Transliterated / translated lyrics — second tab */
  translated: string;
  /** @deprecated use english */
  original: string;
  /** @deprecated use translated */
  translation: string;
  englishDisplay: string;
  translatedDisplay: string;
  hasLyrics: boolean;
};

export function getLyricsDisplayContent(
  englishLyrics: string,
  translatedLyrics?: string
): { englishDisplay: string; translatedDisplay: string } {
  return {
    englishDisplay: (englishLyrics ?? "").trim(),
    translatedDisplay: (translatedLyrics ?? "").trim(),
  };
}

/**
 * Resolves lyrics for the detail page tabs:
 * - English tab: englishLyrics, translationLyrics, transliteratedLyrics (legacy)
 * - Translated tab: translatedLyrics, originalLyrics, lyrics, teluguLyrics (legacy)
 */
export function getSongLyricsContent(song: FirebaseSong): SongLyricsContent {
  const english = (
    song.translationLyrics ??
    song.transliteratedLyrics ??
    ""
  ).trim();

  const translated = (
    song.originalLyrics ??
    song.lyrics ??
    ""
  ).trim();

  const { englishDisplay, translatedDisplay } = getLyricsDisplayContent(
    english,
    translated
  );

  return {
    english,
    translated,
    original: translated,
    translation: english,
    englishDisplay,
    translatedDisplay,
    hasLyrics: Boolean(englishDisplay || translatedDisplay),
  };
}
