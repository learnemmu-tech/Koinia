import type { NotificationContentType } from "@/types/firebase-notification";
import type { EventStatus } from "@/types/firebase-event";
import type { PrayerRequestStatus } from "@/types/firebase-prayer-request";
import type { DonationCampaignStatus } from "@/types/firebase-donation";

import { createPublishNotification } from "@/lib/firebase-notification-queries";

type ContentEmailType = Extract<
  NotificationContentType,
  "song" | "article" | "sermon"
>;

function dispatchContentPublishedEmail(
  type: ContentEmailType | "donation_campaign",
  contentId: string,
  idToken?: string
): void {
  if (!idToken) return;

  void fetch("/api/email/content-published", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ type, contentId }),
  }).catch((error) => {
    console.error(`[email] ${type} dispatch failed:`, error);
  });
}

function dispatchEventPublishedEmail(eventId: string, idToken?: string): void {
  if (!idToken) return;

  void fetch("/api/email/event-published", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ eventId }),
  }).catch((error) => {
    console.error("[email] event dispatch failed:", error);
  });
}

function dispatchPrayerApprovedEmail(prayerId: string, idToken?: string): void {
  if (!idToken) return;

  void fetch("/api/email/prayer-approved", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ prayerId }),
  }).catch((error) => {
    console.error("[email] prayer approved dispatch failed:", error);
  });
}

/**
 * Safe wrapper used by admin publish flows.
 *
 * - Only fires when content transitions into a published state.
 * - Never throws: a notification failure must not break content creation.
 */
export async function notifyIfNewlyPublished(input: {
  type: ContentEmailType;
  contentId: string;
  contentTitle: string;
  image?: string;
  isPublished: boolean;
  wasPublished?: boolean;
  idToken?: string;
  churchId?: string;
  organizationId?: string;
}): Promise<void> {
  const isNewPublish = input.isPublished && !input.wasPublished;
  if (!isNewPublish) return;

  try {
    await createPublishNotification({
      type: input.type,
      contentId: input.contentId,
      contentTitle: input.contentTitle,
      image: input.image,
      churchId: input.churchId,
      organizationId: input.organizationId,
    });
  } catch (error) {
    console.error("[notifyIfNewlyPublished] notification dispatch failed:", error);
  }

  dispatchContentPublishedEmail(input.type, input.contentId, input.idToken);
}

export async function notifyIfEventPublished(input: {
  contentId: string;
  contentTitle: string;
  image?: string;
  status: EventStatus;
  wasStatus?: EventStatus;
  idToken?: string;
  churchId?: string;
  organizationId?: string;
}): Promise<void> {
  const isNewPublish =
    input.status === "published" && input.wasStatus !== "published";
  if (!isNewPublish) return;

  try {
    await createPublishNotification({
      type: "event",
      contentId: input.contentId,
      contentTitle: input.contentTitle,
      image: input.image,
      churchId: input.churchId,
      organizationId: input.organizationId,
    });
  } catch (error) {
    console.error("[notifyIfEventPublished] notification dispatch failed:", error);
  }

  dispatchEventPublishedEmail(input.contentId, input.idToken);
}

export async function notifyIfDonationCampaignPublished(input: {
  contentId: string;
  contentTitle: string;
  status: DonationCampaignStatus;
  wasStatus?: DonationCampaignStatus;
  idToken?: string;
}): Promise<void> {
  const isNewPublish =
    input.status === "active" && input.wasStatus !== "active";
  if (!isNewPublish) return;

  dispatchContentPublishedEmail(
    "donation_campaign",
    input.contentId,
    input.idToken
  );
}

export async function notifyIfPrayerApproved(input: {
  contentId: string;
  contentTitle: string;
  previousStatus: PrayerRequestStatus;
  newStatus: PrayerRequestStatus;
  idToken?: string;
  churchId?: string;
  organizationId?: string;
}): Promise<void> {
  if (input.newStatus !== "approved" || input.previousStatus === "approved") {
    return;
  }

  dispatchPrayerApprovedEmail(input.contentId, input.idToken);
}
