"use server";

import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "./firebase-admin";
import { SONGS_COLLECTION } from "./song-firestore";

/** Increment play count via Admin SDK — does not require client Firestore write rules. */
export async function incrementPlayCount(songId: string): Promise<void> {
  const trimmedId = songId?.trim();
  if (!trimmedId) return;

  const adminDb = getAdminDb();
  if (!adminDb) return;

  try {
    await adminDb.collection(SONGS_COLLECTION).doc(trimmedId).update({
      playCount: FieldValue.increment(1),
    });
  } catch (error) {
    console.warn("[incrementPlayCount] Failed:", error);
  }
}
