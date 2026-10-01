"use server";

import { auth } from "@clerk/nextjs/server";

import {
  triggerPrayerRequestSubmittedNotifications,
  triggerPrayerSubmittedEmails,
} from "@/lib/email/triggers";
import { createPrayerRequest as insertPrayerRequest } from "@/lib/postgres/features";
import { getChurchBySlug } from "@/lib/postgres/tenants";
import { revalidatePrayerWall } from "@/lib/prayer/revalidate-prayer-wall";
import {
  sanitizePrayerRequestInput,
  type PrayerRequestSubmitValues,
} from "@/lib/prayer-request-validation";
import { getPrayerRequestDisplayName } from "@/lib/prayer-request-firestore";
import { assertChurchUsageAllowed } from "@/lib/subscription/subscription-server";

export async function submitPublicChurchPrayerRequest(
  slug: string,
  values: PrayerRequestSubmitValues
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return { ok: false, error: "Please sign in to share a prayer request." };
  }

  const church = await getChurchBySlug(slug);
  if (!church?.isActive || !church.organizationId) {
    return { ok: false, error: "This church could not be found." };
  }

  try {
    await assertChurchUsageAllowed(church.id, "prayerRequests");
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Prayer requests are not available right now.",
    };
  }

  const sanitized = sanitizePrayerRequestInput(values);
  if (!sanitized.title || !sanitized.request) {
    return { ok: false, error: "Please include a title and your request." };
  }

  const emailFromSession =
    typeof sessionClaims?.email === "string" ? sessionClaims.email : undefined;

  const prayerId = await insertPrayerRequest({
    churchId: church.id,
    userId,
    name: sanitized.isAnonymous ? "" : sanitized.name,
    email: sanitized.email || emailFromSession,
    title: sanitized.title,
    request: sanitized.request,
    category: sanitized.category,
    isAnonymous: sanitized.isAnonymous,
    shareWithCommunity: sanitized.shareWithCommunity,
  });
  await revalidatePrayerWall(church.id);

  try {
    const memberName = getPrayerRequestDisplayName({
      name: sanitized.isAnonymous ? "" : sanitized.name,
      isAnonymous: sanitized.isAnonymous,
    });
    const userEmail = (sanitized.email || emailFromSession || "").trim();
    await triggerPrayerRequestSubmittedNotifications({
      prayerId,
      churchId: church.id,
      organizationId: church.organizationId,
      branchId: church.id,
      submitterUserId: userId,
      memberName,
      prayerTitle: sanitized.title,
    });
    if (userEmail) {
      triggerPrayerSubmittedEmails({
        prayerId,
        prayerTitle: sanitized.title,
        userId,
        userEmail,
        userName: memberName,
      });
    }
  } catch {
    // Existing email/notification failures must not block submission.
  }

  return { ok: true };
}
