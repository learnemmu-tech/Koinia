import "server-only";

import {
  addSong as insertSong,
  deleteSong as removeSong,
  getSongById as loadSongById,
  getSongsByIds as loadSongsByIds,
  listSongs,
  updateSong as saveSong,
} from "@/lib/postgres/features";
import type { ContentQueryInput } from "@/lib/content/content-scope";
import type {
  CreateSongInput,
  FirebaseSong,
  UpdateSongInput,
} from "@/types/firebase-song";

export async function getAllSongs(scope: ContentQueryInput): Promise<FirebaseSong[]> {
  return listSongs(scope);
}

export async function getPublishedSongs(
  scope: ContentQueryInput,
  options?: { limit?: number }
): Promise<FirebaseSong[]> {
  return listSongs(scope, { publishedOnly: true, limit: options?.limit });
}

export async function getSongById(songId: string): Promise<FirebaseSong | null> {
  return loadSongById(songId);
}

export async function getSongsByIds(ids: string[]): Promise<FirebaseSong[]> {
  return loadSongsByIds(ids);
}

export async function searchSongs(
  scope: ContentQueryInput,
  searchQuery: string
): Promise<FirebaseSong[]> {
  const normalized = searchQuery.trim().toLowerCase();
  if (!normalized) return [];
  const songs = await getPublishedSongs(scope);
  return songs.filter((song) => {
    const haystack = [
      song.songTitle,
      song.alternateTitle ?? "",
      song.artist ?? "",
      song.category,
      song.scriptureReference ?? "",
      ...song.tags,
      song.title,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

export async function addSong(
  churchId: string,
  songData: CreateSongInput,
  _options?: { branchId?: string; organizationIdFallback?: string }
): Promise<string> {
  return insertSong(churchId, {
    ...songData,
    category: songData.category ?? "Worship",
    featured: songData.featured ?? false,
    published: songData.published ?? true,
    tags: songData.tags ?? [],
  });
}

export async function updateSong(
  songId: string,
  updates: UpdateSongInput
): Promise<void> {
  await saveSong(songId, updates);
}

export async function deleteSong(songId: string): Promise<void> {
  await removeSong(songId);
}

export async function isUsingFirebaseAdmin(): Promise<boolean> {
  return false;
}
