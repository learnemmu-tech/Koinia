"use server";

import {
  createPrayerRequest as insertPrayerRequest,
  deletePrayerRequest as removePrayerRequest,
  recordPrayerIntercession as insertIntercession,
  updatePrayerRequest,
} from "@/lib/postgres/features";
import {
  loadPrayerRequestForWrite,
  requirePrayerSession,
  resolvePrayerViewer,
} from "@/lib/prayer/prayer-authorization";
import { revalidatePrayerWall } from "@/lib/prayer/revalidate-prayer-wall";
import {
  canMarkPrayerAnswered,
  canModeratePrayerRequest,
  canPrayForRequest,
  isSameAuthenticatedUser,
} from "@/lib/prayer/prayer-policy";
import {
  sanitizePrayerRequestInput,
  type PrayerRequestSubmitValues,
} from "@/lib/prayer-request-validation";
import type { PrayerRequestStatus } from "@/types/firebase-prayer-request";

// Every export here is a public server action endpoint. Identity always comes
// from the server session; client-supplied ids are only ever *compared* to it.

export async function createPrayerRequest(
  churchId: string,
  userId: string,
  values: PrayerRequestSubmitValues,
  options?: { email?: string | null; organizationId?: string; branchId?: string }
): Promise<string> {
  const session = await requirePrayerSession();
  if (!isSameAuthenticatedUser(session.clerkId, userId)) {
    throw new Error("Unauthorized");
  }
  const viewer = await resolvePrayerViewer(session, churchId);
  if (!viewer.hasChurchAccess) throw new Error("Unauthorized");

  const sanitized = sanitizePrayerRequestInput(values);
  const { assertChurchUsageAllowed } = await import(
    "@/lib/subscription/subscription-server"
  );
  await assertChurchUsageAllowed(churchId, "prayerRequests");
  const prayerId = await insertPrayerRequest({
    churchId,
    userId: session.clerkId,
    name: sanitized.name,
    email: options?.email ?? sanitized.email,
    title: sanitized.title,
    request: sanitized.request,
    category: sanitized.category,
    isAnonymous: sanitized.isAnonymous,
    shareWithCommunity: sanitized.shareWithCommunity,
  });
  await revalidatePrayerWall(churchId);
  return prayerId;
}

export async function recordPrayerIntercession(
  requestId: string,
  userId: string
): Promise<void> {
  const { session, request, viewer } = await loadPrayerRequestForWrite(requestId);
  if (!isSameAuthenticatedUser(session.clerkId, userId)) {
    throw new Error("Unauthorized");
  }
  if (!canPrayForRequest(request, viewer)) throw new Error("Unauthorized");
  await insertIntercession(requestId, session.clerkId);
}

export async function markPrayerRequestAnswered(requestId: string): Promise<void> {
  const { request, viewer } = await loadPrayerRequestForWrite(requestId);
  if (!canMarkPrayerAnswered(request, viewer)) throw new Error("Unauthorized");
  await updatePrayerRequest(requestId, {
    isAnswered: true,
    answeredAt: Date.now(),
  });
}

export async function updatePrayerRequestStatus(
  requestId: string,
  status: PrayerRequestStatus
): Promise<void> {
  const { request: existing, viewer } = await loadPrayerRequestForWrite(requestId);
  if (!canModeratePrayerRequest(viewer)) throw new Error("Unauthorized");
  await updatePrayerRequest(requestId, { status });
  await revalidatePrayerWall(existing.churchId);
  if (status === "approved" && existing.status !== "approved") {
    try {
      const {
        triggerPrayerApprovedEmail,
        triggerPrayerApprovedMemberNotifications,
      } = await import("@/lib/email/triggers");
      await triggerPrayerApprovedMemberNotifications(requestId);
      await triggerPrayerApprovedEmail(requestId);
    } catch (error) {
      console.error("[notifications] prayer approved dispatch failed", {
        prayerId: requestId,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }
}

export async function deletePrayerRequest(requestId: string): Promise<void> {
  const { viewer, request } = await loadPrayerRequestForWrite(requestId);
  if (!canModeratePrayerRequest(viewer)) throw new Error("Unauthorized");
  await removePrayerRequest(requestId);
  await revalidatePrayerWall(request.churchId);
}
