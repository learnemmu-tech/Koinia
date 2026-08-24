import { Text } from "@react-email/components";

import { EmailButton } from "@/emails/components/email-button";
import { EmailLayout } from "@/emails/components/email-layout";
import { emailConfig } from "@/lib/email/config";

type PrayerApprovedEmailProps = {
  userName: string;
  prayerTitle: string;
  prayerId: string;
};

export function PrayerApprovedEmail({
  userName,
  prayerTitle,
  prayerId,
}: PrayerApprovedEmailProps) {
  return (
    <EmailLayout
      preview="Your prayer request is now live"
      title="Prayer request approved"
    >
      <Text className="email-text" style={{ fontSize: "15px", lineHeight: "1.6", color: "#3d3545", margin: "0 0 12px" }}>
        Hi {userName},
      </Text>
      <Text className="email-text" style={{ fontSize: "15px", lineHeight: "1.6", color: "#3d3545", margin: "0 0 12px" }}>
        Good news — your prayer request <strong>{prayerTitle}</strong> has been
        approved and is now visible to the FaithConnectHub community.
      </Text>
      <Text className="email-muted" style={{ fontSize: "14px", lineHeight: "1.6", color: "#6b5f75", margin: "0 0 20px" }}>
        Others can now pray with you and encourage you on this journey of faith.
      </Text>
      <EmailButton
        href={`${emailConfig.appUrl}/prayer-requests/${prayerId}`}
        label="View on Prayer Wall"
      />
    </EmailLayout>
  );
}
