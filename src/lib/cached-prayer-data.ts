import { unstable_cache } from "next/cache";



import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";



import {

  getApprovedPrayerRequests,

  getLatestApprovedPrayerRequests,

} from "./firebase-prayer-request-queries";

import type { TenantScope } from "./organization/tenant-scope";



function tenantCacheKey(scope: TenantScope): string {

  return `${scope.organizationId}:${scope.churchId}:${scope.branchId ?? ""}`;

}



export async function getApprovedPrayerRequestsCached(

  scope: TenantScope

): Promise<FirebasePrayerRequest[]> {

  const key = tenantCacheKey(scope);

  return unstable_cache(

    async () => getApprovedPrayerRequests(scope),

    ["approved-prayer-requests", key],

    { revalidate: 60, tags: ["prayer-requests", `tenant-${key}`] }

  )();

}



export async function getLatestApprovedPrayerRequestsCached(

  scope: TenantScope,

  limit = 3

): Promise<FirebasePrayerRequest[]> {

  const key = tenantCacheKey(scope);

  return unstable_cache(

    async () => getLatestApprovedPrayerRequests(scope, limit),

    ["latest-approved-prayer-requests", key, String(limit)],

    { revalidate: 60, tags: ["prayer-requests", `tenant-${key}`] }

  )();

}


