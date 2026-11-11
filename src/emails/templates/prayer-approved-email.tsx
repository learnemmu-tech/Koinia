import { EmailButton } from "@/emails/components/email-button";
import { EmailText } from "@/emails/components/email-copy";
import { EmailLayout } from "@/emails/components/email-layout";
import { emailConfig } from "@/lib/email/config";

export function PrayerApprovedEmail({
  userName,
  prayerTitle,
  prayerId,
}: {
  userName: string;
  prayerTitle: string;
  prayerId: string;
}) {
  return (
    <EmailLayout preview="Your prayer request is now shared" eyebrow="Prayer" title="Your request is shared">
      <EmailText>
        Hi {userName}, “{prayerTitle}” has been approved and is now visible to your church community.
      </EmailText>
      <EmailButton href={`${emailConfig.appUrl}/prayer-requests/${prayerId}`} label="View prayer request" />
    </EmailLayout>
  );
}
