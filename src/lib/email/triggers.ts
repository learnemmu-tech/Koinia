import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";
import { normalizeArticleFromFirestore, ARTICLES_COLLECTION } from "@/lib/article-firestore";
import {
  DONATION_CAMPAIGNS_COLLECTION,
  DONATIONS_COLLECTION,
  normalizeDonationCampaignFromFirestore,
  normalizeDonationFromFirestore,
} from "@/lib/donation-firestore";
import {
  EVENTS_COLLECTION,
  formatEventDate,
  normalizeEventFromFirestore,
} from "@/lib/event-firestore";
import {
  PRAYER_REQUESTS_COLLECTION,
  getPrayerRequestDisplayName,
  isPublicPrayerRequest,
  normalizePrayerRequestFromFirestore,
} from "@/lib/prayer-request-firestore";
import { normalizeSermonFromFirestore, SERMONS_COLLECTION } from "@/lib/sermon-firestore";
import {
  getSongArtistLine,
  normalizeSongFromFirestore,
  SONGS_COLLECTION,
} from "@/lib/song-firestore";
import { BRANCH_MEMBERSHIPS_COLLECTION } from "@/lib/organization/branch-membership-firestore";
import { MEMBERSHIPS_COLLECTION } from "@/lib/organization/membership-firestore";
import { roleMeetsMinimum, type MembershipRole } from "@/types/membership";

import { dispatchEmail, EmailService } from "./index";
import {
  canSendPreferenceEmail,
  normalizeEmailPreferences,
} from "./preferences";
import type { EmailPreferenceKey } from "./types";

export type ContentPublishEmailType =
  | "song"
  | "sermon"
  | "article"
  | "donation_campaign";

async function forEachEligibleUser(
  preferenceKey: EmailPreferenceKey,
  onUser: (user: { id: string; email: string; userName: string }) => void
): Promise<number> {
  const adminDb = getAdminDb();
  if (!adminDb) return 0;

  const usersSnap = await adminDb.collection("users").get();
  let queued = 0;

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data() as Record<string, unknown>;
    const email = String(data.email ?? "").trim();
    if (!email) continue;

    const preferences = normalizeEmailPreferences(data.emailPreferences);
    if (!canSendPreferenceEmail(preferences, preferenceKey)) continue;

    const userName =
      `${String(data.firstName ?? "")} ${String(data.lastName ?? "")}`.trim() ||
      "Friend";

    onUser({ id: userDoc.id, email, userName });
    queued += 1;
  }

  return queued;
}

export function triggerWelcomeEmails(input: {
  email: string;
  firstName?: string;
  lastName?: string;
  userId: string;
}): void {
  dispatchEmail("welcome", () =>
    EmailService.sendWelcomeEmail({
      to: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      userId: input.userId,
    })
  );

  dispatchEmail("admin-new-user", () =>
    EmailService.notifyAdmin({
      type: "new_user",
      title: "New user registered",
      summary: "A new user has joined FaithConnectHub.",
      details: {
        Name: `${input.firstName ?? ""} ${input.lastName ?? ""}`.trim() || "—",
        Email: input.email,
      },
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://faithconnecthub.com"}/dashboard/users`,
    })
  );
}

export function triggerPrayerSubmittedEmails(input: {
  prayerId: string;
  prayerTitle: string;
  userId: string;
  userEmail: string;
  userName: string;
}): void {
  dispatchEmail("prayer-confirmation", () =>
    EmailService.sendPrayerConfirmation({
      to: input.userEmail,
      userName: input.userName,
      prayerTitle: input.prayerTitle,
      prayerId: input.prayerId,
      userId: input.userId,
    })
  );

  dispatchEmail("admin-prayer-submitted", () =>
    EmailService.notifyAdmin({
      type: "prayer_submitted",
      title: "New prayer request submitted",
      summary: "A prayer request is awaiting moderation.",
      details: {
        Title: input.prayerTitle,
        Submitter: input.userName,
        Email: input.userEmail,
      },
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://faithconnecthub.com"}/dashboard/content?tab=prayers`,
    })
  );
}

async function getChurchAdminUserIds(input: {
  churchId: string;
  organizationId?: string;
  excludeUserId?: string;
}): Promise<string[]> {
  const adminDb = getAdminDb();
  if (!adminDb) return [];

  const userIds = new Set<string>();
  const churchId = input.churchId.trim();
  if (!churchId) return [];

  const branchSnap = await adminDb
    .collection(BRANCH_MEMBERSHIPS_COLLECTION)
    .where("churchId", "==", churchId)
    .where("status", "==", "active")
    .get();

  for (const doc of branchSnap.docs) {
    const data = doc.data() as Record<string, unknown>;
    const role = String(data.role ?? "member") as MembershipRole;
    const userId = String(data.userId ?? "").trim();
    if (userId && roleMeetsMinimum(role, "church_admin")) {
      userIds.add(userId);
    }
  }

  const organizationId = input.organizationId?.trim();
  if (organizationId) {
    const orgSnap = await adminDb
      .collection(MEMBERSHIPS_COLLECTION)
      .where("organizationId", "==", organizationId)
      .where("status", "==", "active")
      .get();

    for (const doc of orgSnap.docs) {
      const data = doc.data() as Record<string, unknown>;
      const role = String(data.role ?? "member") as MembershipRole;
      const userId = String(data.userId ?? "").trim();
      if (userId && roleMeetsMinimum(role, "org_admin")) {
        userIds.add(userId);
      }
    }
  }

  const excludeUserId = input.excludeUserId?.trim();
  if (excludeUserId) userIds.delete(excludeUserId);

  return [...userIds];
}

export async function triggerPrayerRequestSubmittedNotifications(input: {
  prayerId: string;
  churchId: string;
  organizationId?: string;
  branchId?: string;
  submitterUserId: string;
  memberName: string;
  prayerTitle: string;
}): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) return;

  try {
    const adminUserIds = await getChurchAdminUserIds({
      churchId: input.churchId,
      organizationId: input.organizationId,
      excludeUserId: input.submitterUserId,
    });

    if (adminUserIds.length === 0) return;

    const message = `${input.memberName} submitted a prayer request and is waiting for review.`;
    const basePayload: Record<string, unknown> = {
      type: "prayer_request_submitted",
      churchId: input.churchId,
      title: "New Prayer Request",
      message,
      contentTitle: input.prayerTitle.trim() || "Prayer request",
      contentId: input.prayerId,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    };

    if (input.organizationId?.trim()) {
      basePayload.organizationId = input.organizationId.trim();
    }
    if (input.branchId?.trim()) {
      basePayload.branchId = input.branchId.trim();
    }

    await Promise.all(
      adminUserIds.map((userId) =>
        adminDb.collection("notifications").add({
          ...basePayload,
          userId,
        })
      )
    );
  } catch (error) {
    console.error("[notifications] prayer request submitted failed:", error);
  }
}

export async function canUserModerateChurchPrayers(input: {
  userId: string;
  churchId: string;
  organizationId?: string;
}): Promise<boolean> {
  const adminIds = await getChurchAdminUserIds({
    churchId: input.churchId,
    organizationId: input.organizationId,
  });
  return adminIds.includes(input.userId);
}

export async function triggerPrayerApprovedMemberNotifications(
  prayerId: string
): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) return;

  try {
    const snap = await adminDb
      .collection(PRAYER_REQUESTS_COLLECTION)
      .doc(prayerId)
      .get();

    if (!snap.exists) return;

    const prayer = normalizePrayerRequestFromFirestore(
      snap.id,
      snap.data() as Record<string, unknown>
    );
    const prayerData = snap.data() as Record<string, unknown>;

    if (prayer.status !== "approved" || !isPublicPrayerRequest(prayer)) return;

    const memberSnap = await adminDb
      .collection(BRANCH_MEMBERSHIPS_COLLECTION)
      .where("churchId", "==", prayer.churchId)
      .where("status", "==", "active")
      .get();

    const memberUserIds = [
      ...new Set(
        memberSnap.docs
          .map((doc) => String(doc.data().userId ?? "").trim())
          .filter(Boolean)
      ),
    ];

    if (memberUserIds.length === 0) return;

    const organizationId = String(prayerData.organizationId ?? "").trim();
    const branchId = String(prayerData.branchId ?? "").trim();
    const contentTitle = prayer.title.trim() || "Prayer request";

    await Promise.all(
      memberUserIds.map((userId) => {
        const payload: Record<string, unknown> = {
          type: "prayer",
          userId,
          churchId: prayer.churchId,
          title: "Prayer Request Approved",
          message: "A prayer request is now on the prayer wall.",
          contentTitle,
          contentId: prayer.id,
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        };
        if (organizationId) payload.organizationId = organizationId;
        if (branchId) payload.branchId = branchId;
        return adminDb.collection("notifications").add(payload);
      })
    );
  } catch (error) {
    console.error("[notifications] prayer approved member notify failed:", error);
  }
}

export async function triggerPrayerApprovedEmail(prayerId: string): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) return;

  try {
    const snap = await adminDb
      .collection(PRAYER_REQUESTS_COLLECTION)
      .doc(prayerId)
      .get();

    if (!snap.exists) return;

    const prayer = normalizePrayerRequestFromFirestore(
      snap.id,
      snap.data() as Record<string, unknown>
    );

    const email = prayer.email?.trim();
    if (!email) return;

    await EmailService.sendPrayerApproved({
      to: email,
      userName: prayer.isAnonymous ? "Friend" : prayer.name || "Friend",
      prayerTitle: prayer.title,
      prayerId: prayer.id,
      userId: prayer.userId,
    });
  } catch (error) {
    console.error("[email] prayer approved trigger failed:", error);
  }
}

export function triggerPrayerApprovedEmailDispatch(prayerId: string): void {
  dispatchEmail("prayer-approved", () => triggerPrayerApprovedEmail(prayerId));
}

export async function triggerDonationCompletedEmails(
  donationId: string
): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) return;

  try {
    const donationSnap = await adminDb
      .collection(DONATIONS_COLLECTION)
      .doc(donationId)
      .get();

    if (!donationSnap.exists) return;

    const donation = normalizeDonationFromFirestore(
      donationSnap.id,
      donationSnap.data() as Record<string, unknown>
    );

    if (!donation.donorEmail?.trim()) return;

    const campaignSnap = await adminDb
      .collection(DONATION_CAMPAIGNS_COLLECTION)
      .doc(donation.campaignId)
      .get();

    const campaignTitle =
      campaignSnap.exists ?
        normalizeDonationCampaignFromFirestore(
          campaignSnap.id,
          campaignSnap.data() as Record<string, unknown>
        ).title
      : "Ministry Campaign";

    const amountLabel = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: donation.currency,
    }).format(donation.amount);

    const dateLabel = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    await EmailService.sendDonationReceipt({
      to: donation.donorEmail,
      donorName: donation.donorName,
      amount: amountLabel,
      donationId: donation.id,
      date: dateLabel,
      campaignTitle,
    });

    await EmailService.notifyAdmin({
      type: "donation_received",
      title: "New donation received",
      summary: "A donation has been completed successfully.",
      details: {
        Donor: donation.donorName,
        Amount: amountLabel,
        Campaign: campaignTitle,
        "Donation ID": donation.id,
      },
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://faithconnecthub.com"}/dashboard/content?tab=donations`,
    });
  } catch (error) {
    console.error("[email] donation trigger failed:", error);
  }
}

export async function triggerEventRegistrationEmails(input: {
  eventId: string;
  userId: string;
  userEmail: string;
  userName: string;
}): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) return;

  try {
    const eventSnap = await adminDb
      .collection(EVENTS_COLLECTION)
      .doc(input.eventId)
      .get();

    if (!eventSnap.exists) return;

    const event = normalizeEventFromFirestore(
      eventSnap.id,
      eventSnap.data() as Record<string, unknown>
    );

    await EmailService.sendEventRegistration({
      to: input.userEmail,
      userName: input.userName,
      eventTitle: event.title,
      eventDate: formatEventDate(event.eventDate),
      eventTime: event.eventTime,
      location: event.location,
      eventId: event.id,
      userId: input.userId,
    });

    await EmailService.notifyAdmin({
      type: "event_registration",
      title: "New event registration",
      summary: "Someone registered for an upcoming event.",
      details: {
        Event: event.title,
        Registrant: input.userName,
        Email: input.userEmail,
        Date: formatEventDate(event.eventDate),
      },
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://faithconnecthub.com"}/events/${event.id}`,
    });
  } catch (error) {
    console.error("[email] event registration trigger failed:", error);
  }
}

/**
 * Notify all users with event email notifications enabled about a published event.
 * Sends asynchronously — individual failures are logged and do not block others.
 */
export async function triggerEventAnnouncementEmails(
  eventId: string
): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) {
    console.warn("[email] event announcement skipped: admin not configured");
    return;
  }

  try {
    const eventSnap = await adminDb
      .collection(EVENTS_COLLECTION)
      .doc(eventId)
      .get();

    if (!eventSnap.exists) {
      console.warn("[email] event announcement skipped: event not found", eventId);
      return;
    }

    const event = normalizeEventFromFirestore(
      eventSnap.id,
      eventSnap.data() as Record<string, unknown>
    );

    if (event.status !== "published") {
      return;
    }

    const usersSnap = await adminDb.collection("users").get();
    let queued = 0;

    for (const userDoc of usersSnap.docs) {
      const data = userDoc.data() as Record<string, unknown>;
      const email = String(data.email ?? "").trim();
      if (!email) continue;

      const preferences = normalizeEmailPreferences(data.emailPreferences);
      if (!canSendPreferenceEmail(preferences, "event")) continue;

      const userName =
        `${String(data.firstName ?? "")} ${String(data.lastName ?? "")}`.trim() ||
        "Friend";

      queued += 1;
      dispatchEmail(`event-announcement:${userDoc.id}`, () =>
        EmailService.sendEventAnnouncement({
          to: email,
          userName,
          eventTitle: event.title,
          eventDate: formatEventDate(event.eventDate),
          eventTime: event.eventTime,
          location: event.location,
          description: event.description,
          eventId: event.id,
          userId: userDoc.id,
        })
      );
    }
  } catch (error) {
    console.error("[email] event announcement trigger failed:", error);
  }
}

/**
 * Broadcast content publish emails to users who opted in.
 */
export async function triggerContentAnnouncementEmails(
  type: ContentPublishEmailType,
  contentId: string
): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) {
    console.warn("[email] content announcement skipped: admin not configured");
    return;
  }

  try {
    switch (type) {
      case "song": {
        const snap = await adminDb.collection(SONGS_COLLECTION).doc(contentId).get();
        if (!snap.exists) return;
        const song = normalizeSongFromFirestore(
          snap.id,
          snap.data() as Record<string, unknown>
        );
        if (!song.published) return;

        const artist = getSongArtistLine(song);
        const description = [artist, song.scriptureReference, song.category]
          .filter(Boolean)
          .join(" · ");

        const queued = await forEachEligibleUser("song", (user) => {
          dispatchEmail(`song-published:${user.id}`, () =>
            EmailService.sendSongPublished({
              to: user.email,
              userName: user.userName,
              songTitle: song.songTitle,
              description,
              songId: song.id,
              userId: user.id,
            })
          );
        });
        return;
      }

      case "sermon": {
        const snap = await adminDb.collection(SERMONS_COLLECTION).doc(contentId).get();
        if (!snap.exists) return;
        const sermon = normalizeSermonFromFirestore(
          snap.id,
          snap.data() as Record<string, unknown>
        );
        if (!sermon.isPublished) return;

        const queued = await forEachEligibleUser("sermon", (user) => {
          dispatchEmail(`sermon-published:${user.id}`, () =>
            EmailService.sendSermonPublished({
              to: user.email,
              userName: user.userName,
              sermonTitle: sermon.title,
              speaker: sermon.speaker,
              scriptureReference: sermon.scriptureReference,
              sermonId: sermon.id,
              userId: user.id,
            })
          );
        });
        return;
      }

      case "article": {
        const snap = await adminDb
          .collection(ARTICLES_COLLECTION)
          .doc(contentId)
          .get();
        if (!snap.exists) return;
        const article = normalizeArticleFromFirestore(
          snap.id,
          snap.data() as Record<string, unknown>
        );
        if (!article.isPublished) return;

        const queued = await forEachEligibleUser("article", (user) => {
          dispatchEmail(`article-published:${user.id}`, () =>
            EmailService.sendArticlePublished({
              to: user.email,
              userName: user.userName,
              articleTitle: article.title,
              summary: article.shortDescription,
              articleId: article.id,
              userId: user.id,
            })
          );
        });
        return;
      }

      case "donation_campaign": {
        const snap = await adminDb
          .collection(DONATION_CAMPAIGNS_COLLECTION)
          .doc(contentId)
          .get();
        if (!snap.exists) return;
        const campaign = normalizeDonationCampaignFromFirestore(
          snap.id,
          snap.data() as Record<string, unknown>
        );
        if (campaign.status !== "active") return;

        const goalAmount = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: campaign.currency,
        }).format(campaign.targetAmount);

        const queued = await forEachEligibleUser("donation", (user) => {
          dispatchEmail(`donation-campaign:${user.id}`, () =>
            EmailService.sendDonationCampaignAnnouncement({
              to: user.email,
              userName: user.userName,
              campaignTitle: campaign.title,
              goalAmount,
              description: campaign.description,
              campaignId: campaign.id,
              userId: user.id,
            })
          );
        });
      }
    }
  } catch (error) {
    console.error(`[email] ${type} announcement trigger failed:`, error);
  }
}

export function triggerContactEmails(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): void {
  dispatchEmail("contact-confirmation", () =>
    EmailService.sendContactConfirmation({
      to: input.email,
      name: input.name,
      subject: input.subject,
    })
  );

  dispatchEmail("admin-contact", () =>
    EmailService.notifyAdmin({
      type: "contact_form",
      title: "New contact form submission",
      summary: "Someone submitted the contact form.",
      details: {
        Name: input.name,
        Email: input.email,
        Subject: input.subject,
        Message: input.message.slice(0, 500),
      },
      actionUrl: `mailto:${input.email}`,
    })
  );
}

export function triggerJoinRequestNotification(input: {
  organizationId: string;
  branchId: string;
  churchName: string;
  memberEmail: string;
  memberName: string;
  userId: string;
}): void {
  dispatchEmail("admin-join-request", () =>
    EmailService.notifyAdmin({
      type: "join_request",
      title: "New membership request",
      summary: `Someone requested to join ${input.churchName}.`,
      details: {
        Church: input.churchName,
        Name: input.memberName || "—",
        Email: input.memberEmail || "—",
      },
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://faithconnecthub.com"}/dashboard/church-settings?tab=members`,
    })
  );
}

export async function triggerMembershipApprovedNotification(input: {
  userId: string;
  churchId: string;
  organizationId: string;
  branchId: string;
}): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) return;

  try {
    const [churchSnap, userSnap] = await Promise.all([
      adminDb.collection("churches").doc(input.churchId).get(),
      adminDb.collection("users").doc(input.userId).get(),
    ]);

    const churchName = churchSnap.exists
      ? String(churchSnap.data()?.name ?? "your church").trim() || "your church"
      : "your church";

    const userData = userSnap.data() as Record<string, unknown> | undefined;
    const email = String(userData?.email ?? "").trim();
    const memberName =
      `${String(userData?.firstName ?? "")} ${String(userData?.lastName ?? "")}`.trim() ||
      "Friend";

    const message = `Your request to join ${churchName} has been approved. Welcome!`;

    await adminDb.collection("notifications").add({
      userId: input.userId,
      churchId: input.churchId,
      organizationId: input.organizationId,
      type: "membership_approved",
      title: "Membership Approved",
      message,
      contentTitle: churchName,
      contentId: input.branchId,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    if (email) {
      dispatchEmail("membership-approved", () =>
        EmailService.sendMembershipApproved({
          to: email,
          userName: memberName,
          churchName,
          userId: input.userId,
        })
      );
    }
  } catch (error) {
    console.error("[email] membership approved notification failed:", error);
  }
}
