"use server";

import {
  addFavorite as insertFavorite,
  removeFavorite as deleteFavorite,
} from "@/lib/postgres/features";
import type { FavoriteItemType } from "@/types/firebase-favorite";

export async function addFavorite(
  userId: string,
  itemType: FavoriteItemType,
  itemId: string
): Promise<void> {
  await insertFavorite(userId, itemType, itemId.trim());
}

export async function removeFavorite(
  userId: string,
  itemType: FavoriteItemType,
  itemId: string
): Promise<void> {
  await deleteFavorite(userId, itemType, itemId.trim());
}
