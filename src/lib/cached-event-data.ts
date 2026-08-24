import { cache } from "react";

import { unstable_cache } from "next/cache";



import {

  getEventById,

  getPublishedEventsGrouped,

  getUpcomingPublishedEvents,

} from "./firebase-event-queries";

import {

  recordMatchesTenantScope,

  type TenantScope,

} from "./organization/tenant-scope";



const REVALIDATE_SECONDS = 60;



function tenantCacheKey(scope: TenantScope): string {

  return `${scope.organizationId}:${scope.churchId}:${scope.branchId ?? ""}`;

}



export async function getUpcomingEventsCached(scope: TenantScope) {

  const key = tenantCacheKey(scope);

  return unstable_cache(

    async () => getUpcomingPublishedEvents(scope, 3),

    ["upcoming-events", key],

    { revalidate: REVALIDATE_SECONDS, tags: ["events", `tenant-${key}`] }

  )();

}



export async function getPublishedEventsGroupedCached(scope: TenantScope) {

  const key = tenantCacheKey(scope);

  return unstable_cache(

    async () => getPublishedEventsGrouped(scope),

    ["published-events-grouped", key],

    { revalidate: REVALIDATE_SECONDS, tags: ["events", `tenant-${key}`] }

  )();

}



export const getEventByIdCached = cache(

  async (scope: TenantScope, eventId: string) => {

    const key = tenantCacheKey(scope);

    return unstable_cache(

      async () => {

        const event = await getEventById(eventId);

        if (

          !recordMatchesTenantScope(event, scope, {

            allowLegacyBranchless: true,

            defaultBranchId: scope.branchId ?? null,

          })

        ) {

          return null;

        }

        return event;

      },

      ["event-by-id", key, eventId],

      {

        revalidate: REVALIDATE_SECONDS,

        tags: [`event-${eventId}`, `tenant-${key}`],

      }

    )();

  }

);


