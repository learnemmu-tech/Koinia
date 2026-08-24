import type { DocumentData } from "firebase/firestore";

import type {
  CreateSongInput,
  FirebaseSong,
  SongCategory,
  UpdateSongInput,
} from "@/types/firebase-song";

import { resolveDocumentChurchId } from "./church-scope";
import { parseTenantFieldsFromDocument } from "./organization/tenant-scope";

export const SONGS_COLLECTION = "songs";

const SONG_CATEGORIES = [
  "Worship",
  "Praise",
  "Christmas",
  "Easter",
  "Youth",
  "Choir",
  "Special Event",
] as const satisfies readonly SongCategory[];

function toMillis(value: unknown): number {
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof (value as { toMillis: () => number }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === "number") return value;
  if (
    value &&
    typeof value === "object" &&
    "seconds" in value &&
    typeof (value as { seconds: number }).seconds === "number"
  ) {
    return (value as { seconds: number }).seconds * 1000;
  }
  return Date.now();
}

function parseCategory(value: unknown): SongCategory {
  const raw = String(value ?? "").trim();
  if (SONG_CATEGORIES.includes(raw as SongCategory)) {
    return raw as SongCategory;
  }
  return "Worship";
}

function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function parsePublished(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "false") return false;
    if (value === "true") return true;
  }
  // Existing documents without a publish flag stay visible.
  return true;
}

/** Maps Firestore documents (legacy + new fields) into a unified song model. */
export function normalizeSongFromFirestore(
  id: string,
  data: Record<string, unknown>
): FirebaseSong {
  const rawAudio = String(data.audioUrl ?? data.audioFileUrl ?? "").trim();
  const rawImage = String(data.imageUrl ?? data.coverImageUrl ?? "").trim();
  const rawYoutube = String(data.youtubeUrl ?? data.videoUrl ?? "").trim();

  const songTitle = String(
    data.songTitle ?? data.englishTitle ?? data.title ?? ""
  ).trim();
  const alternateTitle =
    String(data.alternateTitle ?? data.teluguTitle ?? "").trim() || undefined;
  const originalLyrics = String(
    data.originalLyrics ?? data.lyrics ?? data.teluguLyrics ?? ""
  );
  const translationLyrics =
    String(
      data.translationLyrics ??
        data.transliteratedLyrics ??
        data.englishLyrics ??
        ""
    ).trim() || undefined;

  /** Explicit Firestore field for transliterated / translated lyrics (second tab) */
  const translatedLyricsField =
    String(
      data.translatedLyrics ??
        data.originalLyrics ??
        data.lyrics ??
        data.teluguLyrics ??
        ""
    ).trim() || undefined;

  /** Explicit Firestore field for English lyrics (first tab) */
  const englishLyricsField =
    String(
      data.englishLyrics ??
        data.translationLyrics ??
        data.transliteratedLyrics ??
        ""
    ).trim() || undefined;

  const resolvedOriginal = translatedLyricsField ?? originalLyrics;
  const resolvedTranslation = englishLyricsField ?? translationLyrics;

  const tenant = parseTenantFieldsFromDocument(data);

  return {
    id,
    churchId: resolveDocumentChurchId(data),
    organizationId: tenant.organizationId || undefined,
    branchId: tenant.branchId,
    songTitle,
    alternateTitle,
    artist: String(data.artist ?? "").trim() || undefined,
    category: parseCategory(data.category),
    originalLyrics: resolvedOriginal,
    translationLyrics: resolvedTranslation,
    scriptureReference:
      String(data.scriptureReference ?? "").trim() || undefined,
    tags: parseTags(data.tags),
    featured: Boolean(data.featured),
    published: parsePublished(data.published ?? data.isPublished),
    title: songTitle,
    englishTitle: songTitle || undefined,
    teluguTitle: alternateTitle,
    lyrics: originalLyrics,
    transliteratedLyrics: translationLyrics,
    imageUrl: rawImage || undefined,
    audioUrl: rawAudio || undefined,
    youtubeUrl: rawYoutube || undefined,
    playCount: typeof data.playCount === "number" ? data.playCount : 0,
    createdAt: toMillis(data.createdAt),
  };
}

/** Strips heavy lyric fields for list/search payloads. */
export function toSongListItem(song: FirebaseSong): FirebaseSong {
  return {
    ...song,
    originalLyrics: "",
    translationLyrics: undefined,
    lyrics: "",
    transliteratedLyrics: undefined,
  };
}

export function getSongDisplayTitle(song: FirebaseSong): string {
  return song.songTitle || song.englishTitle || song.title || "Untitled Song";
}

export function getSongAlternateTitle(song: FirebaseSong): string | undefined {
  return song.alternateTitle ?? song.teluguTitle;
}

/** Primary subtitle line: artist, or alternate title when no artist. */
export function getSongArtistLine(song: FirebaseSong): string | undefined {
  const artist = song.artist?.trim();
  if (artist) return artist;
  return getSongAlternateTitle(song);
}

export function formatPlayCount(count: number | undefined): string {
  const value = count ?? 0;
  if (value <= 0) return "No plays yet";
  if (value === 1) return "1 play";
  if (value < 1_000) return `${value.toLocaleString()} plays`;
  if (value < 1_000_000) {
    const formatted = (value / 1_000).toFixed(value >= 10_000 ? 0 : 1);
    return `${formatted.replace(/\.0$/, "")}K plays`;
  }
  const formatted = (value / 1_000_000).toFixed(1);
  return `${formatted.replace(/\.0$/, "")}M plays`;
}

export function isSongPublished(song: FirebaseSong): boolean {
  return song.published !== false;
}

export function filterPublishedSongs(songs: FirebaseSong[]): FirebaseSong[] {
  return songs.filter(isSongPublished);
}

export function sortSongsByLatest(songs: FirebaseSong[]): FirebaseSong[] {
  return [...songs].sort((a, b) => b.createdAt - a.createdAt);
}

/** Writes canonical + legacy fields so older clients keep working. */
export function toSongFirestorePayload(
  input: CreateSongInput | UpdateSongInput
): DocumentData {
  const payload: DocumentData = { ...input };

  if (input.songTitle !== undefined) {
    const title = input.songTitle.trim();
    payload.songTitle = title;
    payload.title = title;
    payload.englishTitle = title;
  }

  if (input.alternateTitle !== undefined) {
    const alternate = input.alternateTitle.trim();
    payload.alternateTitle = alternate;
    payload.teluguTitle = alternate;
  }

  if (input.originalLyrics !== undefined) {
    payload.originalLyrics = input.originalLyrics;
    payload.lyrics = input.originalLyrics;
    payload.translatedLyrics = input.originalLyrics;
  }

  if (input.translationLyrics !== undefined) {
    payload.translationLyrics = input.translationLyrics;
    payload.transliteratedLyrics = input.translationLyrics;
    payload.englishLyrics = input.translationLyrics;
  }

  if (input.tags !== undefined) {
    payload.tags = input.tags;
  }

  if (input.published !== undefined) {
    payload.published = input.published;
    payload.isPublished = input.published;
  }

  return payload;
}
