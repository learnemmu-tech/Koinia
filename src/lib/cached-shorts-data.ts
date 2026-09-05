import { unstable_cache } from "next/cache";

import { listShortsForScope } from "@/lib/postgres/shorts";
import type { TenantScope } from "@/lib/organization/tenant-scope";
import type { ShortsFeedFilter } from "@/types/video-short";

function cacheKey(scope: TenantScope, filter: ShortsFeedFilter) {
  return `shorts:${scope.organizationId ?? ""}:${scope.churchId ?? ""}:${filter}`;
}

export async function getPublishedShortsCached(
  scope: TenantScope,
  filter: ShortsFeedFilter = "church"
) {
  if (!scope.churchId) return [];

  return unstable_cache(
    async () =>
      listShortsForScope({
        scope,
        filter,
        viewerClerkId: null,
      }),
    [cacheKey(scope, filter)],
    { revalidate: 60, tags: [`shorts-${scope.churchId}`] }
  )();
}
