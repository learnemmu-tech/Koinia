"use server";

import { auth } from "@clerk/nextjs/server";

import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import {
  parseLikeTarget,
  summarizeLikes,
  toggleLike,
} from "@/lib/postgres/content-likes";
import { rateLimitLike } from "@/lib/rate-limit";
import type { LikeItemType } from "@/lib/like-types";

export async function getLikeSummary(
  items: Array<{ itemType: string; itemId: string }>
): Promise<Record<string, { count: number; liked: boolean }>> {
  const targets = items
    .map((item) => parseLikeTarget(item.itemType, item.itemId))
    .filter((item): item is NonNullable<typeof item> => item !== null);
  const { userId } = await auth();
  const appUser = userId ? await getAppUserByClerkId(userId) : null;
  return summarizeLikes(targets, appUser?.id ?? null);
}

export async function toggleContentLike(
  itemType: LikeItemType,
  itemId: string
): Promise<{ liked: boolean; count: number }> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const target = parseLikeTarget(itemType, itemId);
  if (!target) {
    throw new Error("Invalid content");
  }
  const appUser = await getAppUserByClerkId(userId);
  if (!appUser) {
    throw new Error("Application user not found.");
  }
  const limited = await rateLimitLike(userId);
  if (!limited.allowed) {
    throw new Error("Too many requests.");
  }
  return toggleLike(appUser.id, userId, target);
}
