import "server-only";

import { AdminNotificationEmail } from "@/emails/templates/admin-notification-email";
import { ArticlePublishedEmail } from "@/emails/templates/article-published-email";
import { ContactConfirmationEmail } from "@/emails/templates/contact-confirmation-email";
import { DonationCampaignEmail } from "@/emails/templates/donation-campaign-email";
import { DonationThankYouEmail } from "@/emails/templates/donation-thank-you-email";
import { EventAnnouncementEmail } from "@/emails/templates/event-announcement-email";
import { EventRegistrationEmail } from "@/emails/templates/event-registration-email";
import { MembershipApprovedEmail } from "@/emails/templates/membership-approved-email";
import { PrayerApprovedEmail } from "@/emails/templates/prayer-approved-email";
import { PrayerConfirmationEmail } from "@/emails/templates/prayer-confirmation-email";
import { SermonPublishedEmail } from "@/emails/templates/sermon-published-email";
import { SongPublishedEmail } from "@/emails/templates/song-published-email";
import { WelcomeEmail } from "@/emails/templates/welcome-email";

import { emailConfig } from "./config";
import { sendEmail } from "./send-email";
import { shouldSendUserEmail } from "./user-preferences-server";
import type { AdminNotificationPayload, SendEmailResult } from "./types";

function formatDisplayName(firstName?: string, lastName?: string): string {
  const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return name || "Friend";
}

export const EmailService = {
  async sendWelcomeEmail(input: {
    to: string;
    firstName?: string;
    lastName?: string;
    userId?: string;
  }): Promise<SendEmailResult> {
    const userName = formatDisplayName(input.firstName, input.lastName);
    return sendEmail({
      to: input.to,
      subject: `Welcome to ${emailConfig.appName}`,
      react: WelcomeEmail({ userName }),
    });
  },

  async sendMembershipApproved(input: {
    to: string;
    userName: string;
    churchName: string;
    userId?: string;
  }): Promise<SendEmailResult> {
    return sendEmail({
      to: input.to,
      subject: `Welcome to ${input.churchName}`,
      react: MembershipApprovedEmail({
        userName: input.userName,
        churchName: input.churchName,
      }),
    });
  },

  async sendPrayerConfirmation(input: {
    to: string;
    userName: string;
    prayerTitle: string;
    prayerId: string;
    userId?: string;
  }): Promise<SendEmailResult> {
    if (input.userId) {
      const allowed = await shouldSendUserEmail(input.userId, "prayer");
      if (!allowed) {
        return { success: true };
      }
    }

    return sendEmail({
      to: input.to,
      subject: "Prayer request received — FaithConnectHub",
      react: PrayerConfirmationEmail({
        userName: input.userName,
        prayerTitle: input.prayerTitle,
        prayerId: input.prayerId,
      }),
    });
  },

  async sendPrayerApproved(input: {
    to: string;
    userName: string;
    prayerTitle: string;
    prayerId: string;
    userId?: string;
  }): Promise<SendEmailResult> {
    if (input.userId) {
      const allowed = await shouldSendUserEmail(input.userId, "prayer");
      if (!allowed) {
        return { success: true };
      }
    }

    return sendEmail({
      to: input.to,
      subject: "Your prayer request is now live",
      react: PrayerApprovedEmail({
        userName: input.userName,
        prayerTitle: input.prayerTitle,
        prayerId: input.prayerId,
      }),
    });
  },

  async sendDonationReceipt(input: {
    to: string;
    donorName: string;
    amount: string;
    donationId: string;
    date: string;
    campaignTitle: string;
    userId?: string;
  }): Promise<SendEmailResult> {
    if (input.userId) {
      const allowed = await shouldSendUserEmail(input.userId, "donation");
      if (!allowed) {
        return { success: true };
      }
    }

    return sendEmail({
      to: input.to,
      subject: "Thank you for your donation",
      react: DonationThankYouEmail({
        donorName: input.donorName,
        amount: input.amount,
        donationId: input.donationId,
        date: input.date,
        campaignTitle: input.campaignTitle,
      }),
    });
  },

  async sendEventRegistration(input: {
    to: string;
    userName: string;
    eventTitle: string;
    eventDate: string;
    eventTime?: string;
    location?: string;
    eventId: string;
    userId?: string;
  }): Promise<SendEmailResult> {
    if (input.userId) {
      const allowed = await shouldSendUserEmail(input.userId, "event");
      if (!allowed) {
        return { success: true };
      }
    }

    return sendEmail({
      to: input.to,
      subject: `You're registered: ${input.eventTitle}`,
      react: EventRegistrationEmail({
        userName: input.userName,
        eventTitle: input.eventTitle,
        eventDate: input.eventDate,
        eventTime: input.eventTime,
        location: input.location,
        eventId: input.eventId,
      }),
    });
  },

  async sendEventAnnouncement(input: {
    to: string;
    userName: string;
    eventTitle: string;
    eventDate: string;
    eventTime?: string;
    location?: string;
    description: string;
    eventId: string;
    userId?: string;
  }): Promise<SendEmailResult> {
    if (input.userId) {
      const allowed = await shouldSendUserEmail(input.userId, "event");
      if (!allowed) {
        return { success: true };
      }
    }

    return sendEmail({
      to: input.to,
      subject: `New event: ${input.eventTitle}`,
      react: EventAnnouncementEmail({
        userName: input.userName,
        eventTitle: input.eventTitle,
        eventDate: input.eventDate,
        eventTime: input.eventTime,
        location: input.location,
        description: input.description,
        eventId: input.eventId,
      }),
    });
  },

  async sendSongPublished(input: {
    to: string;
    userName: string;
    songTitle: string;
    description: string;
    songId: string;
    userId?: string;
  }): Promise<SendEmailResult> {
    if (input.userId) {
      const allowed = await shouldSendUserEmail(input.userId, "song");
      if (!allowed) return { success: true };
    }

    return sendEmail({
      to: input.to,
      subject: `New song: ${input.songTitle}`,
      react: SongPublishedEmail({
        userName: input.userName,
        songTitle: input.songTitle,
        description: input.description,
        songId: input.songId,
      }),
    });
  },

  async sendSermonPublished(input: {
    to: string;
    userName: string;
    sermonTitle: string;
    speaker: string;
    scriptureReference: string;
    sermonId: string;
    userId?: string;
  }): Promise<SendEmailResult> {
    if (input.userId) {
      const allowed = await shouldSendUserEmail(input.userId, "sermon");
      if (!allowed) return { success: true };
    }

    return sendEmail({
      to: input.to,
      subject: `New sermon: ${input.sermonTitle}`,
      react: SermonPublishedEmail({
        userName: input.userName,
        sermonTitle: input.sermonTitle,
        speaker: input.speaker,
        scriptureReference: input.scriptureReference,
        sermonId: input.sermonId,
      }),
    });
  },

  async sendArticlePublished(input: {
    to: string;
    userName: string;
    articleTitle: string;
    summary: string;
    articleId: string;
    userId?: string;
  }): Promise<SendEmailResult> {
    if (input.userId) {
      const allowed = await shouldSendUserEmail(input.userId, "article");
      if (!allowed) return { success: true };
    }

    return sendEmail({
      to: input.to,
      subject: `New article: ${input.articleTitle}`,
      react: ArticlePublishedEmail({
        userName: input.userName,
        articleTitle: input.articleTitle,
        summary: input.summary,
        articleId: input.articleId,
      }),
    });
  },

  async sendDonationCampaignAnnouncement(input: {
    to: string;
    userName: string;
    campaignTitle: string;
    goalAmount: string;
    description: string;
    campaignId: string;
    userId?: string;
  }): Promise<SendEmailResult> {
    if (input.userId) {
      const allowed = await shouldSendUserEmail(input.userId, "donation");
      if (!allowed) return { success: true };
    }

    return sendEmail({
      to: input.to,
      subject: `New giving campaign: ${input.campaignTitle}`,
      react: DonationCampaignEmail({
        userName: input.userName,
        campaignTitle: input.campaignTitle,
        goalAmount: input.goalAmount,
        description: input.description,
        campaignId: input.campaignId,
      }),
    });
  },

  async sendContactConfirmation(input: {
    to: string;
    name: string;
    subject: string;
  }): Promise<SendEmailResult> {
    return sendEmail({
      to: input.to,
      subject: "We received your message",
      react: ContactConfirmationEmail({
        name: input.name,
        subject: input.subject,
      }),
    });
  },

  async notifyAdmin(payload: AdminNotificationPayload): Promise<SendEmailResult> {
    return sendEmail({
      to: emailConfig.adminEmail,
      subject: `[Admin] ${payload.title}`,
      react: AdminNotificationEmail({
        title: payload.title,
        summary: payload.summary,
        details: payload.details,
        actionUrl: payload.actionUrl,
      }),
    });
  },
};
