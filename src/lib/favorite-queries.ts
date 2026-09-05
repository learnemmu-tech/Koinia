"use server";

import { listFavorites } from "@/lib/postgres/features";
import type { FirebaseFavorite } from "@/types/firebase-favorite";

export async function fetchUserFavorites(
  userId: string
): Promise<FirebaseFavorite[]> {
  return listFavorites(userId);
}
