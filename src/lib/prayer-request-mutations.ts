"use server";

import {
  createPrayerRequest as insertPrayerRequest,
  deletePrayerRequest as removePrayerRequest,
  recordPrayerIntercession as insertIntercession,
  updatePrayerRequest,
} from "@/lib/postgres/features";
import {
  sanitizePrayerRequestInput,
  type PrayerRequestSubmitValues,
} from "@/lib/prayer-request-validation";
import type { PrayerRequestStatus } from "@/types/firebase-prayer-request";

export async function createPrayerRequest(
  churchId: string,
  userId: string,
  values: PrayerRequestSubmitValues,
  options?: { email?: string | null; organizationId?: string; branchId?: string }
): Promise<string> {
  const sanitized = sanitizePrayerRequestInput(values);
  return insertPrayerRequest({
    churchId,
    userId,
    name: sanitized.name,
    email: options?.email ?? sanitized.email,
    title: sanitized.title,
    request: sanitized.request,
    category: sanitized.category,
    isAnonymous: sanitized.isAnonymous,
    shareWithCommunity: sanitized.shareWithCommunity,
  });
}

export async function recordPrayerIntercession(
  requestId: string,
  userId: string
): Promise<void> {
  await insertIntercession(requestId, userId);
}

export async function markPrayerRequestAnswered(requestId: string): Promise<void> {
  await updatePrayerRequest(requestId, {
    isAnswered: true,
    answeredAt: Date.now(),
  });
}

export async function incrementPrayerCount(requestId: string): Promise<void> {
  const { getPrayerRequestById } = await import("@/lib/postgres/features");
  const existing = await getPrayerRequestById(requestId);
  if (!existing) return;
  await updatePrayerRequest(requestId, {
    prayerCount: existing.prayerCount + 1,
  });
}

export async function updatePrayerRequestStatus(
  requestId: string,
  status: PrayerRequestStatus
): Promise<void> {
  await updatePrayerRequest(requestId, { status });
}

export async function deletePrayerRequest(requestId: string): Promise<void> {
  await removePrayerRequest(requestId);
}
