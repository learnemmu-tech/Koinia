import type { ReactElement } from "react";

import { AdminNotificationEmail } from "@/emails/templates/admin-notification-email";
import { ArticlePublishedEmail } from "@/emails/templates/article-published-email";
import { ContactConfirmationEmail } from "@/emails/templates/contact-confirmation-email";
import { DonationCampaignEmail } from "@/emails/templates/donation-campaign-email";
import { DonationThankYouEmail } from "@/emails/templates/donation-thank-you-email";
import { EventAnnouncementEmail } from "@/emails/templates/event-announcement-email";
import { EventRegistrationEmail } from "@/emails/templates/event-registration-email";
import { GroupInvitationEmail } from "@/emails/templates/group-invitation-email";
import { InvitationEmail } from "@/emails/templates/invitation-email";
import { MembershipApprovedEmail } from "@/emails/templates/membership-approved-email";
import { OrganizationCreatedEmail } from "@/emails/templates/organization-created-email";
import { PrayerApprovedEmail } from "@/emails/templates/prayer-approved-email";
import { PrayerConfirmationEmail } from "@/emails/templates/prayer-confirmation-email";
import { SermonPublishedEmail } from "@/emails/templates/sermon-published-email";
import { ShortPublishedEmail } from "@/emails/templates/short-published-email";
import { SongPublishedEmail } from "@/emails/templates/song-published-email";
import { TrialLifecycleEmail } from "@/emails/templates/trial-lifecycle-email";
import { WelcomeEmail } from "@/emails/templates/welcome-email";
import { emailConfig } from "@/lib/email/config";

const sample = "https://faithconnecthub.com";

export const TEST_EMAIL_TYPES = [
  "welcome",
  "organization",
  "invitation",
  "contact",
  "admin",
  "trial",
  "group",
  "membership",
  "sermon",
  "song",
  "article",
  "video",
  "event",
  "registration",
  "campaign",
  "donation",
  "prayer",
  "prayer-approved",
] as const;

export type TestEmailType = (typeof TEST_EMAIL_TYPES)[number];

export function renderTestEmail(type: TestEmailType): {
  subject: string;
  react: ReactElement;
} {
  const app = emailConfig.appUrl || sample;
  switch (type) {
    case "welcome":
      return {
        subject: "[Test] Welcome",
        react: WelcomeEmail({ userName: "Alex" }),
      };
    case "organization":
      return {
        subject: "[Test] Organization created",
        react: OrganizationCreatedEmail({
          userName: "Alex",
          organizationName: "Sample Church (test)",
          churchName: "Sample Church",
          organizationId: "test-organization",
        }),
      };
    case "invitation":
      return {
        subject: "[Test] Member invitation",
        react: InvitationEmail({
          role: "member",
          inviteLink: `${app}/`,
        }),
      };
    case "contact":
      return {
        subject: "[Test] Contact confirmation",
        react: ContactConfirmationEmail({
          name: "Alex",
          subject: "Test question about the workspace",
        }),
      };
    case "admin":
      return {
        subject: "[Test] Admin notice",
        react: AdminNotificationEmail({
          title: "Test admin notice",
          summary: "This is sample admin copy. No real account was changed.",
          details: { Church: "Sample Church (test)", Status: "Sample only" },
          actionUrl: `${app}/`,
        }),
      };
    case "trial":
      return {
        subject: "[Test] Trial reminder",
        react: TrialLifecycleEmail({
          title: "Your trial ends in 2 days",
          message:
            "This is a sample trial reminder for Sample Church. No subscription was changed.",
          actionLabel: "Review plans",
          actionUrl: `${app}/pricing`,
        }),
      };
    case "group":
      return {
        subject: "[Test] Group invitation",
        react: GroupInvitationEmail({
          userName: "Alex",
          inviterName: "Jordan",
          groupName: "Wednesday prayer (test)",
          churchName: "Sample Church",
          actionUrl: `${app}/`,
        }),
      };
    case "membership":
      return {
        subject: "[Test] Membership approved",
        react: MembershipApprovedEmail({
          userName: "Alex",
          churchName: "Sample Church",
        }),
      };
    case "sermon":
      return {
        subject: "[Test] Sermon",
        react: SermonPublishedEmail({
          userName: "Alex",
          sermonTitle: "A sample sermon title",
          speaker: "Pastor Jordan",
          scriptureReference: "John 1:1",
          sermonId: "test-sermon",
        }),
      };
    case "song":
      return {
        subject: "[Test] Song",
        react: SongPublishedEmail({
          userName: "Alex",
          songTitle: "A sample worship song",
          description: "Sample description for layout testing.",
          songId: "test-song",
        }),
      };
    case "article":
      return {
        subject: "[Test] Article",
        react: ArticlePublishedEmail({
          userName: "Alex",
          articleTitle: "A sample article",
          summary: "A short sample excerpt for the email layout.",
          articleId: "test-article",
        }),
      };
    case "video":
      return {
        subject: "[Test] Video",
        react: ShortPublishedEmail({
          userName: "Alex",
          caption: "A sample video\nShort description for the test email.",
          shortId: "test-video",
        }),
      };
    case "event":
      return {
        subject: "[Test] Event announcement",
        react: EventAnnouncementEmail({
          userName: "Alex",
          eventTitle: "Sample Sunday gathering",
          eventDate: "Sunday, June 21",
          eventTime: "10:00 AM",
          location: "Main hall (sample)",
          description: "Sample event details. This is not a real registration.",
          eventId: "test-event",
        }),
      };
    case "registration":
      return {
        subject: "[Test] Event registration",
        react: EventRegistrationEmail({
          userName: "Alex",
          eventTitle: "Sample Sunday gathering",
          eventDate: "Sunday, June 21",
          eventTime: "10:00 AM",
          location: "Main hall (sample)",
          eventId: "test-event",
        }),
      };
    case "campaign":
      return {
        subject: "[Test] Giving campaign",
        react: DonationCampaignEmail({
          userName: "Alex",
          campaignTitle: "Sample building fund",
          goalAmount: "Rs. 10,000",
          description: "Sample campaign copy. No payment is requested by this email.",
          campaignId: "test-campaign",
        }),
      };
    case "donation":
      return {
        subject: "[Test] Donation thank-you",
        react: DonationThankYouEmail({
          donorName: "Alex",
          amount: "Rs. 500.00",
          donationId: "test-donation",
          date: "June 21, 2026",
          campaignTitle: "Sample building fund",
        }),
      };
    case "prayer":
      return {
        subject: "[Test] Prayer received",
        react: PrayerConfirmationEmail({
          userName: "Alex",
          prayerTitle: "Sample prayer request",
          prayerId: "test-prayer",
        }),
      };
    case "prayer-approved":
      return {
        subject: "[Test] Prayer approved",
        react: PrayerApprovedEmail({
          userName: "Alex",
          prayerTitle: "Sample prayer request",
          prayerId: "test-prayer",
        }),
      };
  }
}
