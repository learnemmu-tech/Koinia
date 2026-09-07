import { cache } from "react";

import { unstable_cache } from "next/cache";

import {
  getEventById,
  getPublishedEventsGrouped,
  getUpcomingPublishedEvents,
} from "./firebase-event-queries";
import type { ContentQueryInput } from "@/lib/content/content-scope";
import {
  contentCacheKey,
  recordMatchesContentQuery,
} from "@/lib/content/content-scope";

const REVALIDATE_SECONDS = 60;

function queryCacheKey(query: ContentQueryInput): string {
  return contentCacheKey(query);
}

export async function getUpcomingEventsCached(query: ContentQueryInput) {
  const key = queryCacheKey(query);
  return unstable_cache(
    async () => getUpcomingPublishedEvents(query, 3),
    ["upcoming-events", key],
    { revalidate: REVALIDATE_SECONDS, tags: ["events", `content-${key}`] }
  )();
}

export async function getPublishedEventsGroupedCached(query: ContentQueryInput) {
  const key = queryCacheKey(query);
  return unstable_cache(
    async () => getPublishedEventsGrouped(query),
    ["published-events-grouped", key],
    { revalidate: REVALIDATE_SECONDS, tags: ["events", `content-${key}`] }
  )();
}

export const getEventByIdCached = cache(
  async (query: ContentQueryInput, eventId: string) => {
    const key = queryCacheKey(query);
    return unstable_cache(
      async () => {
        const event = await getEventById(eventId);
        if (!recordMatchesContentQuery(event, query)) {
          return null;
        }
        return event;
      },
      ["event-by-id", key, eventId],
      {
        revalidate: REVALIDATE_SECONDS,
        tags: [`event-${eventId}`, `content-${key}`],
      }
    )();
  }
);
