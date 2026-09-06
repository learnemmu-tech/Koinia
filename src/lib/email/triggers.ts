import "server-only";

import {
  createUserNotifications,
  createPublishNotifications,
  getArticleById,
  getDonationById,
  getDonationCampaignById,
  getEventById,
  getPrayerRequestById,
  getSongById,
  getSermonById,
  listActiveChurchMembersForEmail,
  listChurchAdminAppUsers,
} from "@/lib/postgres/features";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { getShortById } from "@/lib/postgres/shorts";
import { getChurchById } from "@/lib/postgres/tenants";
import { formatEventDate } from "@/lib/event-firestore";
import {
  isPublicPrayerRequest,
} from "@/lib/prayer-request-firestore";
import { getSongArtistLine } from "@/lib/song-firestore";

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

type EmailRecipient = { id: string; email: string; userName: string };

async function listEligibleChurchEmailRecipients(input: {
  churchId: string;
  preferenceKey?: EmailPreferenceKey;
  excludeClerkId?: string;
}): Promise<EmailRecipient[]> {
  const rows = await listActiveChurchMembersForEmail(input.churchId);
  const exclude = input.excludeClerkId?.trim();
  const recipients: EmailRecipient[] = [];

  for (const row of rows) {
    if (exclude && row.clerkId === exclude) continue;
    const email = row.email.trim();
    if (!email) continue;

    if (input.preferenceKey) {
      const preferences = normalizeEmailPreferences(row.emailPreferences);
      if (!canSendPreferenceEmail(preferences, input.preferenceKey)) continue;
    }

    recipients.push({
      id: row.clerkId ?? row.id,
      email,
      userName: `${row.firstName} ${row.lastName}`.trim() || "Friend",
    });
  }

  return recipients;
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
}): Promise<Array<{ userId: string; clerkId: string | null }>> {
  const churchId = input.churchId.trim();
  if (!churchId) return [];

  const admins = await listChurchAdminAppUsers(churchId, input.organizationId);
  const excludeUserId = input.excludeUserId?.trim();
  if (!excludeUserId) return admins;

  return admins.filter(
    (admin) => admin.clerkId !== excludeUserId && admin.userId !== excludeUserId
  );
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
  try {
    const church = await getChurchById(input.churchId);
    if (!church?.organizationId) return;

    const admins = await getChurchAdminUserIds({
      churchId: input.churchId,
      organizationId: input.organizationId ?? church.organizationId,
      excludeUserId: input.submitterUserId,
    });

    if (admins.length === 0) return;

    await createUserNotifications({
      userIds: admins.map((admin) => admin.userId),
      type: "prayer_request_submitted",
      churchId: church.id,
      organizationId: church.organizationId ?? "",
      title: "New Prayer Request",
      message: `${input.memberName} submitted a prayer request and is waiting for review.`,
      contentTitle: input.prayerTitle.trim() || "Prayer request",
      contentId: input.prayerId,
    });
  } catch (error) {
    console.error("[notifications] prayer request submitted failed:", error);
  }
}

export async function canUserModerateChurchPrayers(input: {
  userId: string;
  churchId: string;
  organizationId?: string;
}): Promise<boolean> {
  const admins = await getChurchAdminUserIds({
    churchId: input.churchId,
    organizationId: input.organizationId,
  });
  return admins.some(
    (admin) => admin.clerkId === input.userId || admin.userId === input.userId
  );
}

export async function triggerPrayerApprovedMemberNotifications(
  prayerId: string
): Promise<void> {
  try {
    const prayer = await getPrayerRequestById(prayerId);
    if (!prayer) return;
    if (prayer.status !== "approved" || !isPublicPrayerRequest(prayer)) return;

    await createPublishNotifications({
      type: "prayer",
      contentId: prayer.id,
      contentTitle: prayer.title.trim() || "Prayer request",
      churchId: prayer.churchId,
    });
  } catch (error) {
    console.error("[notifications] prayer approved member notify failed:", error);
  }
}

export async function triggerPrayerApprovedEmail(prayerId: string): Promise<void> {
  try {
    const prayer = await getPrayerRequestById(prayerId);
    if (!prayer) return;

    const email = prayer.email?.trim();
    if (!email) return;

    await EmailService.sendPrayerApproved({
      to: email,
      userName: prayer.isAnonymous ? "Friend" : prayer.name || "Friend",
      prayerTitle: prayer.title,
      prayerId: prayer.id,
      userId: prayer.userId ?? "",
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
  try {
    const donation = await getDonationById(donationId);
    if (!donation || !donation.donorEmail?.trim()) return;

    const campaign = await getDonationCampaignById(donation.campaignId);
    const campaignTitle = campaign?.title ?? "Ministry Campaign";

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
  try {
    const event = await getEventById(input.eventId);
    if (!event) return;

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

export async function triggerEventAnnouncementEmails(
  eventId: string,
  excludeClerkId?: string
): Promise<void> {
  try {
    const event = await getEventById(eventId);
    if (!event) {
      console.warn("[email] event announcement skipped: event not found", eventId);
      return;
    }

    if (event.status !== "published") {
      return;
    }

    const recipients = await listEligibleChurchEmailRecipients({
      churchId: event.churchId,
      preferenceKey: "event",
      excludeClerkId,
    });

    await Promise.allSettled(
      recipients.map((user) =>
        EmailService.sendEventAnnouncement({
          to: user.email,
          userName: user.userName,
          eventTitle: event.title,
          eventDate: formatEventDate(event.eventDate),
          eventTime: event.eventTime,
          location: event.location,
          description: event.description,
          eventId: event.id,
          userId: user.id,
        })
      )
    );
  } catch (error) {
    console.error("[email] event announcement trigger failed:", error);
  }
}

export async function triggerContentAnnouncementEmails(
  type: ContentPublishEmailType,
  contentId: string,
  excludeClerkId?: string
): Promise<void> {
  try {
    switch (type) {
      case "song": {
        const song = await getSongById(contentId);
        if (!song || song.published === false) return;

        const artist = getSongArtistLine(song);
        const description = [artist, song.scriptureReference, song.category]
          .filter(Boolean)
          .join(" · ");

        const recipients = await listEligibleChurchEmailRecipients({
          churchId: song.churchId,
          preferenceKey: "song",
          excludeClerkId,
        });

        await Promise.allSettled(
          recipients.map((user) =>
            EmailService.sendSongPublished({
              to: user.email,
              userName: user.userName,
              songTitle: song.songTitle,
              description,
              songId: song.id,
              userId: user.id,
            })
          )
        );
        return;
      }

      case "sermon": {
        const sermon = await getSermonById(contentId);
        if (!sermon || !sermon.isPublished) return;

        const recipients = await listEligibleChurchEmailRecipients({
          churchId: sermon.churchId,
          preferenceKey: "sermon",
          excludeClerkId,
        });

        await Promise.allSettled(
          recipients.map((user) =>
            EmailService.sendSermonPublished({
              to: user.email,
              userName: user.userName,
              sermonTitle: sermon.title,
              speaker: sermon.speaker,
              scriptureReference: sermon.scriptureReference,
              sermonId: sermon.id,
              userId: user.id,
            })
          )
        );
        return;
      }

      case "article": {
        const article = await getArticleById(contentId);
        if (!article || !article.isPublished) return;

        const recipients = await listEligibleChurchEmailRecipients({
          churchId: article.churchId,
          preferenceKey: "article",
          excludeClerkId,
        });

        await Promise.allSettled(
          recipients.map((user) =>
            EmailService.sendArticlePublished({
              to: user.email,
              userName: user.userName,
              articleTitle: article.title,
              summary: article.shortDescription,
              articleId: article.id,
              userId: user.id,
            })
          )
        );
        return;
      }

      case "donation_campaign": {
        const campaign = await getDonationCampaignById(contentId);
        if (!campaign || campaign.status !== "active") return;

        const goalAmount = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: campaign.currency,
        }).format(campaign.targetAmount);

        const recipients = await listEligibleChurchEmailRecipients({
          churchId: campaign.churchId,
          preferenceKey: "donation",
          excludeClerkId,
        });

        await Promise.allSettled(
          recipients.map((user) =>
            EmailService.sendDonationCampaignAnnouncement({
              to: user.email,
              userName: user.userName,
              campaignTitle: campaign.title,
              goalAmount,
              description: campaign.description,
              campaignId: campaign.id,
              userId: user.id,
            })
          )
        );
      }
    }
  } catch (error) {
    console.error(`[email] ${type} announcement trigger failed:`, error);
  }
}

export async function triggerShortPublishedEmails(
  shortId: string,
  excludeClerkId?: string
): Promise<void> {
  try {
    const short = await getShortById(shortId);
    if (!short?.publishedAt || !short.videoUrl) return;

    const recipients = await listEligibleChurchEmailRecipients({
      churchId: short.churchId,
      excludeClerkId,
    });

    const caption = short.caption.trim() || "A new Short from your church";

    await Promise.allSettled(
      recipients.map((user) =>
        EmailService.sendShortPublished({
          to: user.email,
          userName: user.userName,
          caption,
          shortId: short.id,
          userId: user.id,
        })
      )
    );
  } catch (error) {
    console.error("[email] short published trigger failed:", error);
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
  try {
    const [church, appUser] = await Promise.all([
      getChurchById(input.churchId),
      getAppUserByClerkId(input.userId),
    ]);

    const churchName = church?.name?.trim() || "your church";
    const email = appUser?.email?.trim() ?? "";
    const memberName =
      `${appUser?.firstName ?? ""} ${appUser?.lastName ?? ""}`.trim() || "Friend";
    const message = `Your request to join ${churchName} has been approved. Welcome!`;

    if (appUser && church?.organizationId) {
      await createUserNotifications({
        userIds: [appUser.id],
        type: "membership_approved",
        churchId: church.id,
        organizationId: church.organizationId ?? "",
        title: "Membership Approved",
        message,
        contentTitle: churchName,
        contentId: input.branchId || church.id,
      });
    }

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
