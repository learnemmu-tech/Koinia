import { Text } from "@react-email/components";

import { EmailButton } from "@/emails/components/email-button";
import { EmailLayout } from "@/emails/components/email-layout";
import { emailConfig } from "@/lib/email/config";

type PrayerConfirmationEmailProps = {
  userName: string;
  prayerTitle: string;
  prayerId: string;
};

export function PrayerConfirmationEmail({
  userName,
  prayerTitle,
  prayerId,
}: PrayerConfirmationEmailProps) {
  return (
    <EmailLayout
      preview="Your prayer request was received"
      title="Prayer request received"
    >
      <Text className="email-text" style={{ fontSize: "15px", lineHeight: "1.6", color: "#3d3545", margin: "0 0 12px" }}>
        Hi {userName},
      </Text>
      <Text className="email-text" style={{ fontSize: "15px", lineHeight: "1.6", color: "#3d3545", margin: "0 0 12px" }}>
        Thank you for sharing your prayer request: <strong>{prayerTitle}</strong>.
        Our team will review it shortly before it appears on the community prayer wall.
      </Text>
      <Text className="email-muted" style={{ fontSize: "14px", lineHeight: "1.6", color: "#6b5f75", margin: "0 0 20px" }}>
        &ldquo;Do not be anxious about anything, but in every situation, by prayer
        and petition, with thanksgiving, present your requests to God.&rdquo; — Philippians 4:6
      </Text>
      <EmailButton
        href={`${emailConfig.appUrl}/prayer-requests/${prayerId}`}
        label="View Prayer Request"
      />
    </EmailLayout>
  );
}
