import type { NotificationContentType } from "@/types/firebase-notification";
import type { EventStatus } from "@/types/firebase-event";
import type { PrayerRequestStatus } from "@/types/firebase-prayer-request";
import type { DonationCampaignStatus } from "@/types/firebase-donation";

/**
 * Safe wrapper used by admin publish flows.
 *
 * Song/sermon/article/event in-app notifications and emails are dispatched by
 * POST /api/content after the database write. Donation and prayer approval
 * notifications are dispatched from their server mutations. These client
 * helpers stay as no-ops so existing admin UIs keep a single call site
 * without a second trigger.
 */
export async function notifyIfNewlyPublished(_input: {
  type: Extract<NotificationContentType, "song" | "article" | "sermon">;
  contentId: string;
  contentTitle: string;
  image?: string;
  isPublished: boolean;
  wasPublished?: boolean;
  idToken?: string;
  churchId?: string;
  organizationId?: string;
}): Promise<void> {
  return;
}

export async function notifyIfEventPublished(_input: {
  contentId: string;
  contentTitle: string;
  image?: string;
  status: EventStatus;
  wasStatus?: EventStatus;
  idToken?: string;
  churchId?: string;
  organizationId?: string;
}): Promise<void> {
  return;
}

export async function notifyIfDonationCampaignPublished(_input: {
  contentId: string;
  contentTitle: string;
  status: DonationCampaignStatus;
  wasStatus?: DonationCampaignStatus;
  idToken?: string;
}): Promise<void> {
  return;
}

export async function notifyIfPrayerApproved(_input: {
  contentId: string;
  contentTitle: string;
  previousStatus: PrayerRequestStatus;
  newStatus: PrayerRequestStatus;
  idToken?: string;
  churchId?: string;
  organizationId?: string;
}): Promise<void> {
  return;
}
