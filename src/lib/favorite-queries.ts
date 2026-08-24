import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import type { FirebaseFavorite } from "@/types/firebase-favorite";

import {
  FAVORITES_COLLECTION,
  normalizeFavoriteFromFirestore,
} from "./favorite-firestore";
import { db } from "./firebase";

function sortFavoritesByCreatedAtDesc(
  favorites: FirebaseFavorite[]
): FirebaseFavorite[] {
  return [...favorites].sort((a, b) => b.createdAt - a.createdAt);
}

export async function fetchUserFavorites(
  userId: string
): Promise<FirebaseFavorite[]> {
  const favoritesQuery = query(
    collection(db, FAVORITES_COLLECTION),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(favoritesQuery);
  const favorites = snapshot.docs.map((docSnap) =>
    normalizeFavoriteFromFirestore(
      docSnap.id,
      docSnap.data() as Record<string, unknown>
    )
  );

  return sortFavoritesByCreatedAtDesc(favorites);
}

/** @deprecated Use fetchUserFavorites with React Query instead. */
export function subscribeToUserFavorites(
  userId: string,
  onChange: (favorites: FirebaseFavorite[]) => void,
  onError?: (error: Error) => void
): () => void {
  void fetchUserFavorites(userId)
    .then(onChange)
    .catch((error) => {
      onError?.(error instanceof Error ? error : new Error("Failed to load favorites"));
    });
  return () => {};
}
