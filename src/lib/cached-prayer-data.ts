import { unstable_cache } from "next/cache";

import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";

import {
  getApprovedPrayerRequests,
  getLatestApprovedPrayerRequests,
} from "./firebase-prayer-request-queries";
import type { ContentQueryInput } from "@/lib/content/content-scope";
import { contentCacheKey } from "@/lib/content/content-scope";

function queryCacheKey(query: ContentQueryInput): string {
  return contentCacheKey(query);
}

export async function getApprovedPrayerRequestsCached(
  query: ContentQueryInput
): Promise<FirebasePrayerRequest[]> {
  const key = queryCacheKey(query);
  return unstable_cache(
    async () => getApprovedPrayerRequests(query),
    ["approved-prayer-requests", key],
    { revalidate: 60, tags: ["prayer-requests", `content-${key}`] }
  )();
}

export async function getLatestApprovedPrayerRequestsCached(
  query: ContentQueryInput,
  limit = 3
): Promise<FirebasePrayerRequest[]> {
  const key = queryCacheKey(query);
  return unstable_cache(
    async () => getLatestApprovedPrayerRequests(query, limit),
    ["latest-approved-prayer-requests", key, String(limit)],
    { revalidate: 60, tags: ["prayer-requests", `content-${key}`] }
  )();
}
