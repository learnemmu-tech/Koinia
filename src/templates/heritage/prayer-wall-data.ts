"use server";

import { tenantContentQuery } from "@/lib/content/content-scope";
import { listApprovedPrayerRequests } from "@/lib/prayer-request-queries.server";
import {
  getPrayerSession,
  resolvePrayerViewer,
} from "@/lib/prayer/prayer-authorization";
import { getChurchBySlug } from "@/lib/postgres/tenants";
import { isPrayerRequestVisibleOnChurchWall } from "@/templates/heritage/prayer";
import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";

/**
 * Authorized Heritage wall payload for one church (from the URL slug).
 * Never accepts a client-supplied church id.
 */
export async function listHeritagePrayerWall(
  slug: string
): Promise<FirebasePrayerRequest[]> {
  const church = await getChurchBySlug(slug);
  if (!church?.isActive || !church.organizationId) return [];

  const session = await getPrayerSession();
  if (!session) return [];
  const viewer = await resolvePrayerViewer(session, church.id);
  if (!viewer.hasChurchAccess) return [];

  const approved = await listApprovedPrayerRequests(
    tenantContentQuery({
      organizationId: church.organizationId,
      churchId: church.id,
      branchId: church.id,
    })
  );
  return approved.filter((request) =>
    isPrayerRequestVisibleOnChurchWall(request, church.id)
  );
}
