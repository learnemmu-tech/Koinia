import "server-only";

import { ARTICLES_COLLECTION } from "@/lib/article-firestore";
import { CHURCHES_COLLECTION } from "@/lib/church-firestore";
import { DONATION_CAMPAIGNS_COLLECTION } from "@/lib/donation-firestore";
import { EVENTS_COLLECTION } from "@/lib/event-firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { getChurchIdsForOrganization } from "@/lib/organization/resolve-tenant-scope";
import { SERMONS_COLLECTION } from "@/lib/sermon-firestore";
import { SONGS_COLLECTION } from "@/lib/song-firestore";
import type { SubscriptionUsage } from "@/types/subscription";

import { EMPTY_USAGE } from "./limits";

async function countByField(
  collection: string,
  field: string,
  value: string
): Promise<number> {
  const adminDb = getAdminDb();
  if (!adminDb || !value.trim()) return 0;

  const snap = await adminDb
    .collection(collection)
    .where(field, "==", value)
    .count()
    .get();

  return snap.data().count;
}

async function countMembersForOrganization(
  organizationId: string,
  churchIds: string[]
): Promise<number> {
  const adminDb = getAdminDb();
  if (!adminDb) return 0;

  const byOrg = await countByField("users", "organizationId", organizationId);
  if (byOrg > 0) return byOrg;

  if (churchIds.length === 0) return 0;

  let total = 0;
  for (const churchId of churchIds) {
    total += await countByField("users", "churchId", churchId);
  }
  return total;
}

async function countAdminsForOrganization(
  organizationId: string,
  churchIds: string[]
): Promise<number> {
  const adminDb = getAdminDb();
  if (!adminDb) return 0;

  const snap = await adminDb
    .collection("memberships")
    .where("organizationId", "==", organizationId)
    .where("status", "==", "active")
    .get();

  const adminRoles = new Set([
    "owner",
    "org_admin",
    "church_admin",
    "editor",
  ]);

  const membershipAdmins = snap.docs.filter((doc) =>
    adminRoles.has(String(doc.data().role ?? ""))
  ).length;

  if (membershipAdmins > 0) return membershipAdmins;

  if (churchIds.length === 0) return 0;

  let total = 0;
  for (const churchId of churchIds) {
    const churchAdmins = await adminDb
      .collection("users")
      .where("churchId", "==", churchId)
      .where("churchRole", "==", "admin")
      .count()
      .get();
    total += churchAdmins.data().count;
  }
  return total;
}

async function countContentForOrganization(
  collection: string,
  organizationId: string,
  churchIds: string[]
): Promise<number> {
  const byOrg = await countByField(collection, "organizationId", organizationId);
  if (byOrg > 0) return byOrg;

  if (churchIds.length === 0) return 0;

  let total = 0;
  for (const churchId of churchIds) {
    total += await countByField(collection, "churchId", churchId);
  }
  return total;
}

/** Compute live usage for an organization tenant. */
export async function computeOrganizationUsage(
  organizationId: string
): Promise<SubscriptionUsage> {
  if (!organizationId.trim()) return { ...EMPTY_USAGE };

  try {
    const churchIds = await getChurchIdsForOrganization(organizationId);
    const churches =
      churchIds.length > 0
        ? churchIds.length
        : await countByField(CHURCHES_COLLECTION, "organizationId", organizationId);

    const [
      members,
      songs,
      sermons,
      articles,
      admins,
      events,
      donationCampaigns,
    ] = await Promise.all([
      countMembersForOrganization(organizationId, churchIds),
      countContentForOrganization(SONGS_COLLECTION, organizationId, churchIds),
      countContentForOrganization(SERMONS_COLLECTION, organizationId, churchIds),
      countContentForOrganization(ARTICLES_COLLECTION, organizationId, churchIds),
      countAdminsForOrganization(organizationId, churchIds),
      countContentForOrganization(EVENTS_COLLECTION, organizationId, churchIds),
      countContentForOrganization(
        DONATION_CAMPAIGNS_COLLECTION,
        organizationId,
        churchIds
      ),
    ]);

    return {
      members,
      songs,
      sermons,
      articles,
      churches: Math.max(1, churches),
      admins,
      events,
      donationCampaigns,
    };
  } catch (error) {
    console.error("[subscription] org usage compute failed:", error);
    return { ...EMPTY_USAGE };
  }
}

/** @deprecated Use computeOrganizationUsage — kept for legacy callers */
export async function computeChurchUsage(
  churchId: string
): Promise<SubscriptionUsage> {
  const adminDb = getAdminDb();
  if (!adminDb || !churchId.trim()) return { ...EMPTY_USAGE };

  const churchSnap = await adminDb
    .collection(CHURCHES_COLLECTION)
    .doc(churchId)
    .get();

  const organizationId = churchSnap.exists
    ? String(churchSnap.data()?.organizationId ?? "").trim()
    : "";

  if (organizationId) {
    return computeOrganizationUsage(organizationId);
  }

  return computeOrganizationUsage(churchId);
}
