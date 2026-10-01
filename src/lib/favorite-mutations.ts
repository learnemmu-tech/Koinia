"use server";

import { auth } from "@clerk/nextjs/server";

import {
  addFavorite as insertFavorite,
  removeFavorite as deleteFavorite,
} from "@/lib/postgres/features";
import { normalizeFavoriteItemType } from "@/lib/favorite-firestore";
import type { FavoriteItemType } from "@/types/firebase-favorite";

async function requireFavoriteSession(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

function requireFavoriteItem(itemType: FavoriteItemType, itemId: string) {
  const trimmedId = itemId.trim();
  if (!trimmedId) {
    throw new Error("Item id is required");
  }
  const normalizedType = normalizeFavoriteItemType(itemType);
  if (normalizedType !== itemType) {
    throw new Error("Invalid favorite type");
  }
  return { itemType: normalizedType, itemId: trimmedId };
}

export async function addFavorite(
  itemType: FavoriteItemType,
  itemId: string
): Promise<void> {
  const userId = await requireFavoriteSession();
  const item = requireFavoriteItem(itemType, itemId);
  await insertFavorite(userId, item.itemType, item.itemId);
}

export async function removeFavorite(
  itemType: FavoriteItemType,
  itemId: string
): Promise<void> {
  const userId = await requireFavoriteSession();
  const item = requireFavoriteItem(itemType, itemId);
  await deleteFavorite(userId, item.itemType, item.itemId);
}
