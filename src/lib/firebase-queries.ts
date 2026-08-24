"use server";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { FieldValue } from "firebase-admin/firestore";

import type {
  CreateSongInput,
  FirebaseSong,
  UpdateSongInput,
} from "@/types/firebase-song";

import { getAdminDb, isAdminConfigured } from "./firebase-admin";
import { db } from "./firebase";
import {
  filterPublishedSongs,
  normalizeSongFromFirestore,
  toSongFirestorePayload,
} from "./song-firestore";
import { filterRecordsByChurch } from "./church-scope";
import { buildAdminChurchScopedQuery, buildChurchScopedQuery } from "./church-query-builder";
import type { TenantScope } from "./organization/tenant-scope";
import { fetchTenantCollection } from "./tenant-content-server";
import { isRecoverableAdminError, wrapFirebaseError } from "./firebase-utils";
import { mergeTenantFieldsIntoPayload } from "./organization/resolve-tenant-scope";

const SONGS_COLLECTION = "songs";

function toMillis(value: unknown): number {
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof (value as { toMillis: () => number }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  if (typeof value === "number") {
    return value;
  }
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

// function normalizeSong(
//   id: string,
//   data: Record<string, unknown>
// ): FirebaseSong {
//   const rawAudio = String(data.audioUrl ?? data.audioFileUrl ?? "").trim();
//   const rawImage = String(data.imageUrl ?? data.coverImageUrl ?? "").trim();
//   const rawYoutube = String(data.youtubeUrl ?? data.videoUrl ?? "").trim();

//   return {
//     id,
//     title: String(data.title ?? ""),
//     lyrics: String(data.lyrics ?? data.teluguLyrics ?? ""),
//     transliteratedLyrics: String(
//       data.transliteratedLyrics ?? data.englishLyrics ?? ""
//     ),
//     imageUrl: rawImage || undefined,
//     audioUrl: rawAudio || undefined,
//     youtubeUrl: rawYoutube || undefined,
//     createdAt: toMillis(data.createdAt),
//   };
// }

function normalizeSong(id: string, data: Record<string, unknown>): FirebaseSong {
  return normalizeSongFromFirestore(id, data);
}

async function fetchAllSongs(scope: TenantScope): Promise<FirebaseSong[]> {
  return fetchTenantCollection(
    SONGS_COLLECTION,
    scope,
    normalizeSong,
    {
      orderField: "createdAt",
      orderDirection: "desc",
      defaultBranchId: scope.branchId ?? null,
    }
  );
}

export async function getAllSongs(scope: TenantScope): Promise<FirebaseSong[]> {
  return fetchAllSongs(scope);
}

export async function getPublishedSongs(scope: TenantScope): Promise<FirebaseSong[]> {
  const songs = await fetchAllSongs(scope);
  return filterPublishedSongs(songs);
}

async function fetchSongById(songId: string): Promise<FirebaseSong | null> {
  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      const snapshot = await adminDb
        .collection(SONGS_COLLECTION)
        .doc(songId)
        .get();

      if (!snapshot.exists) {
        return null;
      }

      const song = normalizeSong(
        snapshot.id,
        snapshot.data() as Record<string, unknown>
      );
      return song;
    } catch (error) {
      if (!isRecoverableAdminError(error)) {
        wrapFirebaseError(error);
      }
      console.warn("[Firebase] Admin SDK unavailable, using client SDK:", error);
    }
  }

  try {
    const songRef = doc(db, SONGS_COLLECTION, songId);
    const snapshot = await getDoc(songRef);

    if (!snapshot.exists()) {
      return null;
    }

    const song = normalizeSong(
      snapshot.id,
      snapshot.data() as Record<string, unknown>
    );
    return song;
  } catch (error) {
    wrapFirebaseError(error);
  }
}

export async function getSongById(songId: string): Promise<FirebaseSong | null> {
  return fetchSongById(songId);
}

// export async function searchSongs(searchQuery: string): Promise<FirebaseSong[]> {
//   const normalized = searchQuery.trim().toLowerCase();
//   if (!normalized) return [];

//   const songs = await getAllSongs();
//   return songs.filter((song) => song.title.toLowerCase().includes(normalized));
// }

// ── 2. Update searchSongs function ───────────────────────────────
// Find searchSongs and update the filter to search all three title fields:
 
export async function searchSongs(
  scope: TenantScope,
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
      song.englishTitle ?? "",
      song.teluguTitle ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}

export async function addSong(
  churchId: string,
  songData: CreateSongInput,
  options?: { branchId?: string; organizationIdFallback?: string }
): Promise<string> {
  const basePayload = toSongFirestorePayload({
    ...songData,
    category: songData.category ?? "Worship",
    featured: songData.featured ?? false,
    published: songData.published ?? true,
    tags: songData.tags ?? [],
  });

  const payload = await mergeTenantFieldsIntoPayload(
    basePayload as Record<string, unknown>,
    churchId,
    {
      branchId: options?.branchId,
      organizationIdFallback: options?.organizationIdFallback,
    }
  );

  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      const docRef = await adminDb.collection(SONGS_COLLECTION).add({
        ...payload,
        createdAt: FieldValue.serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      if (!isRecoverableAdminError(error)) {
        wrapFirebaseError(error);
      }
      console.warn("[Firebase] Admin SDK unavailable, using client SDK:", error);
    }
  }

  try {
    const docRef = await addDoc(collection(db, SONGS_COLLECTION), {
      ...payload,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    wrapFirebaseError(error);
  }
}

export async function updateSong(
  songId: string,
  updates: UpdateSongInput
): Promise<void> {
  const payload = toSongFirestorePayload(updates);
  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      await adminDb.collection(SONGS_COLLECTION).doc(songId).update(payload);
      return;
    } catch (error) {
      if (!isRecoverableAdminError(error)) {
        wrapFirebaseError(error);
      }
      console.warn("[Firebase] Admin SDK unavailable, using client SDK:", error);
    }
  }

  try {
    const songRef = doc(db, SONGS_COLLECTION, songId);
    await updateDoc(songRef, payload);
  } catch (error) {
    wrapFirebaseError(error);
  }
}

export async function deleteSong(songId: string): Promise<void> {
  const adminDb = getAdminDb();

  if (adminDb) {
    try {
      await adminDb.collection(SONGS_COLLECTION).doc(songId).delete();
      return;
    } catch (error) {
      if (!isRecoverableAdminError(error)) {
        wrapFirebaseError(error);
      }
      console.warn("[Firebase] Admin SDK unavailable, using client SDK:", error);
    }
  }

  try {
    const songRef = doc(db, SONGS_COLLECTION, songId);
    await deleteDoc(songRef);
  } catch (error) {
    wrapFirebaseError(error);
  }
}

export async function isUsingFirebaseAdmin(): Promise<boolean> {
  return isAdminConfigured();
}


