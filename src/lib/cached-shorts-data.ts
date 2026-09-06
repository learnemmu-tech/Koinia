import { unstable_cache } from "next/cache";

import { listShortsForScope } from "@/lib/postgres/shorts";
import type { TenantScope } from "@/lib/organization/tenant-scope";
import type { ShortsFeedFilter } from "@/types/video-short";

function cacheKey(
  scope: TenantScope,
  filter: ShortsFeedFilter,
  audience: "guest" | "member" = "guest"
) {
  return `shorts:${scope.organizationId ?? ""}:${scope.churchId ?? ""}:${filter}:${audience}`;
}

/** Public-only Shorts feed (anonymous visitors). */
export async function getPublishedShortsCached(
  scope: TenantScope,
  filter: ShortsFeedFilter = "church",
  limit = 30
) {
  if (!scope.churchId) return [];

  return unstable_cache(
    async () =>
      listShortsForScope({
        scope,
        filter,
        viewerClerkId: null,
        limit,
      }),
    [cacheKey(scope, filter, "guest")],
    { revalidate: 60, tags: [`shorts-${scope.churchId}`] }
  )();
}

type ShortsViewerContext = {
  clerkId: string | null;
  email?: string;
  limit?: number;
};

/** Respects visibility rules for the current viewer (church + public Shorts for members). */
export async function getPublishedShortsForViewer(
  scope: TenantScope,
  filter: ShortsFeedFilter = "church",
  viewer?: ShortsViewerContext
) {
  if (!scope.churchId) return [];

  const limit = viewer?.limit ?? 30;

  if (viewer?.clerkId) {
    return listShortsForScope({
      scope,
      filter,
      viewerClerkId: viewer.clerkId,
      viewerEmail: viewer.email,
      limit,
    });
  }

  return getPublishedShortsCached(scope, filter, limit);
}
