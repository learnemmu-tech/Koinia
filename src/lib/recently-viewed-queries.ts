import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import type { FirebaseRecentlyViewed } from "@/types/firebase-recently-viewed";

import {
  normalizeRecentlyViewedFromFirestore,
  RECENTLY_VIEWED_COLLECTION,
  RECENTLY_VIEWED_LIMIT,
  sortRecentlyViewedByViewedAtDesc,
} from "./recently-viewed-firestore";
import { db } from "./firebase";

export function subscribeToUserRecentlyViewed(
  userId: string,
  onChange: (items: FirebaseRecentlyViewed[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const recentlyViewedQuery = query(
    collection(db, RECENTLY_VIEWED_COLLECTION),
    where("userId", "==", userId),
    orderBy("viewedAt", "desc"),
    limit(RECENTLY_VIEWED_LIMIT)
  );

  return onSnapshot(
    recentlyViewedQuery,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) =>
        normalizeRecentlyViewedFromFirestore(
          docSnap.id,
          docSnap.data() as Record<string, unknown>
        )
      );
      onChange(sortRecentlyViewedByViewedAtDesc(items));
    },
    (error) => {
      console.error("[subscribeToUserRecentlyViewed]", error);
      onError?.(error);
    }
  );
}
