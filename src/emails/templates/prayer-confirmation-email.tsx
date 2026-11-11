import { EmailButton } from "@/emails/components/email-button";
import { EmailText } from "@/emails/components/email-copy";
import { EmailLayout } from "@/emails/components/email-layout";
import { emailConfig } from "@/lib/email/config";

export function PrayerConfirmationEmail({
  userName,
  prayerTitle,
  prayerId,
}: {
  userName: string;
  prayerTitle: string;
  prayerId: string;
}) {
  return (
    <EmailLayout preview="Your prayer request was received" eyebrow="Prayer" title="We received your request">
      <EmailText>
        Hi {userName}, your prayer request “{prayerTitle}” was received. It stays private until a leader approves it for the community.
      </EmailText>
      <EmailButton href={`${emailConfig.appUrl}/prayer-requests/${prayerId}`} label="View your request" />
    </EmailLayout>
  );
}
