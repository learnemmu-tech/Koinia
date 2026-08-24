import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import type { NotificationContentType } from "@/types/firebase-notification";

import { getAdminDb } from "@/lib/firebase-admin";
import { BRANCH_MEMBERSHIPS_COLLECTION } from "@/lib/organization/branch-membership-firestore";
import { NOTIFICATION_PRESETS } from "@/lib/firebase-notification-queries";

const NOTIFICATIONS_COLLECTION = "notifications";

export type PublishNotificationInput = {
  type: NotificationContentType;
  contentId: string;
  contentTitle: string;
  image?: string;
  organizationId?: string;
  churchId?: string;
  branchId?: string | null;
};

async function getActiveMemberUserIdsForChurch(
  adminDb: NonNullable<ReturnType<typeof getAdminDb>>,
  churchId: string
): Promise<string[]> {
  const snapshot = await adminDb
    .collection(BRANCH_MEMBERSHIPS_COLLECTION)
    .where("churchId", "==", churchId.trim())
    .where("status", "==", "active")
    .get();

  return [
    ...new Set(
      snapshot.docs
        .map((docSnap) => String(docSnap.data().userId ?? "").trim())
        .filter(Boolean)
    ),
  ];
}

/**
 * Fan-out publish notifications using Admin SDK (bypasses client security rules).
 */
export async function createPublishNotificationServer(
  input: PublishNotificationInput
): Promise<string | null> {
  const adminDb = getAdminDb();
  if (!adminDb) {
    console.warn("[notifications] Admin SDK unavailable — skipping fan-out");
    return null;
  }

  if (!input.contentId.trim() || !input.contentTitle.trim()) {
    return null;
  }

  const churchId = input.churchId?.trim();
  if (!churchId) {
    return null;
  }

  const recipientUserIds = await getActiveMemberUserIdsForChurch(
    adminDb,
    churchId
  );
  if (recipientUserIds.length === 0) {
    console.warn("[notifications] no active members for church", churchId);
    return null;
  }

  const preset = NOTIFICATION_PRESETS[input.type] ?? NOTIFICATION_PRESETS.song;

  const basePayload: Record<string, unknown> = {
    type: input.type,
    title: preset.title,
    message: preset.message,
    contentTitle: input.contentTitle.trim(),
    image: input.image?.trim() || "",
    contentId: input.contentId,
    churchId,
    createdAt: FieldValue.serverTimestamp(),
  };

  if (input.organizationId?.trim()) {
    basePayload.organizationId = input.organizationId.trim();
  }
  if (input.branchId?.trim()) {
    basePayload.branchId = input.branchId.trim();
  }

  const batch = adminDb.batch();
  let firstId: string | null = null;

  for (const userId of recipientUserIds) {
    const ref = adminDb.collection(NOTIFICATIONS_COLLECTION).doc();
    if (!firstId) firstId = ref.id;
    batch.set(ref, { ...basePayload, userId });
  }

  await batch.commit();
  return firstId;
}
