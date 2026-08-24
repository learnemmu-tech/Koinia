import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import type { RecentlyViewedItemType } from "@/types/firebase-recently-viewed";

import {
  buildRecentlyViewedDocId,
  buildRecentlyViewedPayload,
  RECENTLY_VIEWED_COLLECTION,
  RECENTLY_VIEWED_LIMIT,
} from "./recently-viewed-firestore";
import { db } from "./firebase";

export async function recordRecentlyViewed(
  userId: string,
  itemType: RecentlyViewedItemType,
  itemId: string
): Promise<void> {
  const trimmedId = itemId.trim();
  if (!trimmedId) return;

  const docId = buildRecentlyViewedDocId(userId, itemType, trimmedId);
  const payload = buildRecentlyViewedPayload(userId, itemType, trimmedId);

  try {
    await setDoc(
      doc(db, RECENTLY_VIEWED_COLLECTION, docId),
      {
        ...payload,
        viewedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await trimRecentlyViewedForUser(userId);
  } catch (error) {
    console.warn("[recordRecentlyViewed] Failed:", error);
  }
}

/** @deprecated Use recordRecentlyViewed */
export const trackRecentlyViewedItem = recordRecentlyViewed;

export async function clearRecentlyViewedHistory(userId: string): Promise<void> {
  const trimmedUserId = userId.trim();
  if (!trimmedUserId) return;

  const recentlyViewedQuery = query(
    collection(db, RECENTLY_VIEWED_COLLECTION),
    where("userId", "==", trimmedUserId)
  );

  const snapshot = await getDocs(recentlyViewedQuery);
  if (snapshot.empty) return;

  await Promise.all(snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));
}

async function trimRecentlyViewedForUser(userId: string): Promise<void> {
  const recentlyViewedQuery = query(
    collection(db, RECENTLY_VIEWED_COLLECTION),
    where("userId", "==", userId),
    orderBy("viewedAt", "desc")
  );

  const snapshot = await getDocs(recentlyViewedQuery);
  const extras = snapshot.docs.slice(RECENTLY_VIEWED_LIMIT);

  if (extras.length === 0) return;

  await Promise.all(extras.map((docSnap) => deleteDoc(docSnap.ref)));
}
