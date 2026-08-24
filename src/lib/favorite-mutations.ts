import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import type { FavoriteItemType } from "@/types/firebase-favorite";

import {
  buildFavoriteCreatePayload,
  buildFavoriteDocId,
  FAVORITES_COLLECTION,
} from "./favorite-firestore";
import { db } from "./firebase";
import { wrapFirebaseError } from "./firebase-utils";

export async function addFavorite(
  userId: string,
  itemType: FavoriteItemType,
  itemId: string
): Promise<void> {
  const trimmedId = itemId.trim();
  if (!trimmedId) throw new Error("Item id is required");

  const docId = buildFavoriteDocId(userId, itemType, trimmedId);
  const payload = buildFavoriteCreatePayload(userId, itemType, trimmedId);

  try {
    await setDoc(doc(db, FAVORITES_COLLECTION, docId), {
      ...payload,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    wrapFirebaseError(error);
  }
}

export async function removeFavorite(
  userId: string,
  itemType: FavoriteItemType,
  itemId: string
): Promise<void> {
  const trimmedId = itemId.trim();
  if (!trimmedId) throw new Error("Item id is required");

  const docId = buildFavoriteDocId(userId, itemType, trimmedId);

  try {
    await deleteDoc(doc(db, FAVORITES_COLLECTION, docId));
  } catch (error) {
    wrapFirebaseError(error);
  }
}
