import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import {
  CHURCHES_COLLECTION,
  normalizeChurchFromFirestore,
} from "@/lib/church-firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { SUBSCRIPTIONS_COLLECTION } from "@/lib/subscription/subscription-firestore";

import { ORGANIZATIONS_COLLECTION } from "./organization-firestore";

export type MigrationResult = {
  churchesUpdated: number;
  subscriptionsLinked: number;
  skipped: number;
};

/**
 * Backfill organizationId on legacy churches and link org-level subscription.
 * Safe to run multiple times (idempotent merges).
 */
export async function backfillChurchOrganizationId(
  churchId: string,
  organizationId: string
): Promise<boolean> {
  const adminDb = getAdminDb();
  if (!adminDb || !churchId.trim() || !organizationId.trim()) return false;

  const churchRef = adminDb.collection(CHURCHES_COLLECTION).doc(churchId);
  const snap = await churchRef.get();
  if (!snap.exists) return false;

  const church = normalizeChurchFromFirestore(
    snap.id,
    snap.data() as Record<string, unknown>
  );

  if (church.organizationId?.trim() === organizationId.trim()) {
    return false;
  }

  await churchRef.update({
    organizationId: organizationId.trim(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return true;
}

/**
 * Migrate legacy per-church subscription doc to organization-owned subscription.
 * Does not delete legacy church subscription docs (non-breaking).
 */
export async function linkLegacyChurchSubscriptionToOrganization(
  churchId: string,
  organizationId: string
): Promise<boolean> {
  const adminDb = getAdminDb();
  if (!adminDb) return false;

  const legacyRef = adminDb.collection(SUBSCRIPTIONS_COLLECTION).doc(churchId);
  const orgRef = adminDb.collection(SUBSCRIPTIONS_COLLECTION).doc(organizationId);

  const [legacySnap, orgSnap] = await Promise.all([
    legacyRef.get(),
    orgRef.get(),
  ]);

  if (orgSnap.exists) return false;
  if (!legacySnap.exists) return false;

  const data = legacySnap.data() as Record<string, unknown>;
  await orgRef.set({
    ...data,
    organizationId,
    churchId: null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return true;
}

export async function migrateOrganizationChurches(
  organizationId: string
): Promise<MigrationResult> {
  const adminDb = getAdminDb();
  if (!adminDb) {
    return { churchesUpdated: 0, subscriptionsLinked: 0, skipped: 0 };
  }

  const orgSnap = await adminDb
    .collection(ORGANIZATIONS_COLLECTION)
    .doc(organizationId)
    .get();

  if (!orgSnap.exists) {
    return { churchesUpdated: 0, subscriptionsLinked: 0, skipped: 0 };
  }

  const churchesSnap = await adminDb
    .collection(CHURCHES_COLLECTION)
    .where("organizationId", "==", organizationId)
    .get();

  let churchesUpdated = 0;
  let subscriptionsLinked = 0;
  let skipped = 0;

  for (const doc of churchesSnap.docs) {
    const updated = await backfillChurchOrganizationId(doc.id, organizationId);
    if (updated) churchesUpdated += 1;
    else skipped += 1;

    const linked = await linkLegacyChurchSubscriptionToOrganization(
      doc.id,
      organizationId
    );
    if (linked) subscriptionsLinked += 1;
  }

  return { churchesUpdated, subscriptionsLinked, skipped };
}

const CONTENT_COLLECTIONS = [
  "songs",
  "sermons",
  "ceremonies",
  "articles",
  "events",
  "prayerRequests",
  "donationCampaigns",
  "donations",
] as const;

export type ContentMigrationResult = {
  collection: string;
  updated: number;
  skipped: number;
};

/**
 * Backfill organizationId, churchId, and branchId on legacy content documents.
 * Idempotent — only patches documents missing tenant fields.
 */
export async function migrateContentTenantFieldsForChurch(
  churchId: string
): Promise<ContentMigrationResult[]> {
  const adminDb = getAdminDb();
  if (!adminDb || !churchId.trim()) return [];

  const churchSnap = await adminDb
    .collection(CHURCHES_COLLECTION)
    .doc(churchId)
    .get();

  if (!churchSnap.exists) return [];

  const church = normalizeChurchFromFirestore(
    churchSnap.id,
    churchSnap.data() as Record<string, unknown>
  );

  const organizationId = church.organizationId?.trim() || "";
  const branchId = church.defaultBranchId?.trim() || "";

  if (!organizationId || !branchId) {
    return [];
  }

  const results: ContentMigrationResult[] = [];

  for (const collectionName of CONTENT_COLLECTIONS) {
    let updated = 0;
    let skipped = 0;

    const snap = await adminDb
      .collection(collectionName)
      .where("churchId", "==", churchId)
      .get();

    for (const doc of snap.docs) {
      const data = doc.data() as Record<string, unknown>;
      const patch: Record<string, unknown> = {};

      if (!String(data.organizationId ?? "").trim()) {
        patch.organizationId = organizationId;
      }
      if (!String(data.churchId ?? "").trim()) {
        patch.churchId = churchId;
      }
      if (!String(data.branchId ?? "").trim()) {
        patch.branchId = branchId;
      }

      if (Object.keys(patch).length === 0) {
        skipped += 1;
        continue;
      }

      patch.updatedAt = FieldValue.serverTimestamp();
      await doc.ref.update(patch);
      updated += 1;
    }

    results.push({ collection: collectionName, updated, skipped });
  }

  return results;
}
