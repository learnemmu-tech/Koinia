import { unstable_cache } from "next/cache";

import { listPublishedChurchVideos } from "@/lib/postgres/church-videos";
import type { ContentQueryInput } from "@/lib/content/content-scope";
import { contentCacheKey } from "@/lib/content/content-scope";

export async function getPublishedChurchVideosCached(
  query: ContentQueryInput,
  limit = 24
) {
  return unstable_cache(
    async () =>
      listPublishedChurchVideos({
        query,
        viewerClerkId: null,
        limit,
      }),
    [`videos:${contentCacheKey(query)}`],
    { revalidate: 60, tags: [`videos-${contentCacheKey(query)}`] }
  )();
}

export async function getChurchVideosForViewer(
  query: ContentQueryInput,
  viewer?: {
    clerkId: string | null;
    email?: string;
    includeUnpublished?: boolean;
    limit?: number;
  }
) {
  if (viewer?.clerkId) {
    return listPublishedChurchVideos({
      query,
      viewerClerkId: viewer.clerkId,
      viewerEmail: viewer.email,
      includeUnpublished: viewer.includeUnpublished,
      limit: viewer.limit ?? 24,
    });
  }

  return getPublishedChurchVideosCached(query, viewer?.limit ?? 24);
}
