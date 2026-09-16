import type { NotificationContentType } from "@/types/firebase-notification";
import type { EventStatus } from "@/types/firebase-event";
import type { PrayerRequestStatus } from "@/types/firebase-prayer-request";
import type { DonationCampaignStatus } from "@/types/firebase-donation";

import { firebaseAuth } from "@/lib/firebase-auth-service";
import { createPublishNotification } from "@/lib/firebase-notification-queries";

type ContentEmailType = Extract<
  NotificationContentType,
  "song" | "article" | "sermon"
>;

async function resolveFreshIdToken(fallback?: string): Promise<string | undefined> {
  try {
    const user = firebaseAuth.currentUser;
    if (user) {
      return await user.getIdToken(true);
    }
  } catch (error) {
    console.error("[email] failed to refresh auth token:", error);
  }
  return fallback?.trim() || undefined;
}

function postEmailNotification(
  path: string,
  body: Record<string, string>,
  idToken: string,
  label: string
): void {
  void fetch(path, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  })
    .then((response) => {
      if (!response.ok) {
        console.error(`[email] ${label} dispatch rejected`, {
          status: response.status,
        });
      }
    })
    .catch((error) => {
      console.error(`[email] ${label} dispatch failed:`, error);
    });
}

function dispatchContentPublishedEmail(
  type: ContentEmailType | "donation_campaign",
  contentId: string,
  idToken?: string
): void {
  void resolveFreshIdToken(idToken).then((token) => {
    if (!token) {
      console.error(`[email] ${type} dispatch skipped: missing auth token`);
      return;
    }
    postEmailNotification(
      "/api/email/content-published",
      { type, contentId },
      token,
      type
    );
  });
}

function dispatchPrayerApprovedEmail(prayerId: string, idToken?: string): void {
  void resolveFreshIdToken(idToken).then((token) => {
    if (!token) {
      console.error("[email] prayer approved dispatch skipped: missing auth token");
      return;
    }
    postEmailNotification(
      "/api/email/prayer-approved",
      { prayerId },
      token,
      "prayer approved"
    );
  });
}

/**
 * Safe wrapper used by admin publish flows.
 *
 * In-app notifications are created here. Song/sermon/article/event emails are
 * scheduled by POST /api/content so a stale client token cannot drop them.
 * Never throws: a notification failure must not break content creation.
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

  void createPublishNotification({
    type: input.type,
    contentId: input.contentId,
    contentTitle: input.contentTitle,
    image: input.image,
    churchId: input.churchId,
    organizationId: input.organizationId,
  }).catch((error) => {
    console.error("[notifyIfNewlyPublished] notification dispatch failed:", error);
  });
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

  void createPublishNotification({
    type: "event",
    contentId: input.contentId,
    contentTitle: input.contentTitle,
    image: input.image,
    churchId: input.churchId,
    organizationId: input.organizationId,
  }).catch((error) => {
    console.error("[notifyIfEventPublished] notification dispatch failed:", error);
  });
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
