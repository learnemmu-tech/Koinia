"use server";

import { auth } from "@clerk/nextjs/server";

import { listFavorites } from "@/lib/postgres/features";
import type { FirebaseFavorite } from "@/types/firebase-favorite";

export async function fetchUserFavorites(): Promise<FirebaseFavorite[]> {
  const { userId } = await auth();
  if (!userId) return [];
  return listFavorites(userId);
}
