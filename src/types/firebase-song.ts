export const SONG_CATEGORIES = [
  "Worship",
  "Praise",
  "Christmas",
  "Easter",
  "Youth",
  "Choir",
  "Special Event",
] as const;

export type SongCategory = (typeof SONG_CATEGORIES)[number];

export type FirebaseSong = {
  id: string;
  organizationId?: string;
  churchId: string;
  branchId?: string | null;
  /** Primary display title */
  songTitle: string;
  alternateTitle?: string;
  artist?: string;
  category: SongCategory;
  originalLyrics: string;
  translationLyrics?: string;
  scriptureReference?: string;
  tags: string[];
  featured: boolean;
  published: boolean;
  /** @deprecated Use songTitle — kept for legacy reads */
  title: string;
  /** @deprecated Use songTitle */
  englishTitle?: string;
  /** @deprecated Use alternateTitle */
  teluguTitle?: string;
  /** @deprecated Use originalLyrics */
  lyrics: string;
  /** @deprecated Use translationLyrics */
  transliteratedLyrics?: string;
  imageUrl?: string;
  audioUrl?: string;
  youtubeUrl?: string;
  createdAt: number;
  playCount?: number;
};

export type CreateSongInput = {
  songTitle: string;
  alternateTitle?: string;
  artist?: string;
  category?: SongCategory;
  originalLyrics: string;
  translationLyrics?: string;
  scriptureReference?: string;
  tags?: string[];
  featured?: boolean;
  published?: boolean;
  imageUrl?: string;
  audioUrl?: string;
  youtubeUrl?: string;
};

export type UpdateSongInput = Partial<CreateSongInput>;
