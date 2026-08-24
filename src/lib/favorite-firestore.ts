import type {
  FavoriteItemType,
  FirebaseFavorite,
} from "@/types/firebase-favorite";

import { toMillis } from "./firebase-utils";

export const FAVORITES_COLLECTION = "favorites";

const VALID_ITEM_TYPES = new Set<FavoriteItemType>([
  "song",
  "sermon",
  "article",
  "event",
]);

export function normalizeFavoriteItemType(value: unknown): FavoriteItemType {
  const raw = String(value ?? "").trim() as FavoriteItemType;
  return VALID_ITEM_TYPES.has(raw) ? raw : "song";
}

export function buildFavoriteDocId(
  userId: string,
  itemType: FavoriteItemType,
  itemId: string
): string {
  const safeItemId = itemId.replace(/\//g, "_");
  return `${userId}__${itemType}__${safeItemId}`;
}

export function normalizeFavoriteFromFirestore(
  id: string,
  data: Record<string, unknown>
): FirebaseFavorite {
  return {
    id,
    userId: String(data.userId ?? "").trim(),
    itemId: String(data.itemId ?? "").trim(),
    itemType: normalizeFavoriteItemType(data.itemType),
    createdAt: toMillis(data.createdAt),
  };
}

export function buildFavoriteCreatePayload(
  userId: string,
  itemType: FavoriteItemType,
  itemId: string
) {
  return {
    userId,
    itemId: itemId.trim(),
    itemType,
  };
}

export function getFavoriteLookupKey(
  itemType: FavoriteItemType,
  itemId: string
): string {
  return `${itemType}:${itemId.trim()}`;
}
