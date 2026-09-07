import { unstable_cache } from "next/cache";

import { listShortsForScope } from "@/lib/postgres/shorts";
import type { ContentQueryInput } from "@/lib/content/content-scope";
import { contentCacheKey } from "@/lib/content/content-scope";
import type { ShortsFeedFilter } from "@/types/video-short";

function cacheKey(
  query: ContentQueryInput,
  filter: ShortsFeedFilter,
  audience: "guest" | "member" = "guest"
) {
  return `shorts:${contentCacheKey(query)}:${filter}:${audience}`;
}

/** Public-only Shorts feed (anonymous visitors). */
export async function getPublishedShortsCached(
  query: ContentQueryInput,
  filter: ShortsFeedFilter = "church",
  limit = 30
) {
  return unstable_cache(
    async () =>
      listShortsForScope({
        query,
        filter,
        viewerClerkId: null,
        limit,
      }),
    [cacheKey(query, filter, "guest")],
    { revalidate: 60, tags: [`shorts-${contentCacheKey(query)}`] }
  )();
}

type ShortsViewerContext = {
  clerkId: string | null;
  email?: string;
  limit?: number;
};

/** Respects visibility rules for the current viewer (church + public Shorts for members). */
export async function getPublishedShortsForViewer(
  query: ContentQueryInput,
  filter: ShortsFeedFilter = "church",
  viewer?: ShortsViewerContext
) {
  const limit = viewer?.limit ?? 30;

  if (viewer?.clerkId) {
    return listShortsForScope({
      query,
      filter,
      viewerClerkId: viewer.clerkId,
      viewerEmail: viewer.email,
      limit,
    });
  }

  return getPublishedShortsCached(query, filter, limit);
}
