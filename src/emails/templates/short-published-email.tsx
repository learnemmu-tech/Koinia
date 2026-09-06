import { Text } from "@react-email/components";

import { EmailButton } from "@/emails/components/email-button";
import { EmailLayout } from "@/emails/components/email-layout";
import { emailConfig } from "@/lib/email/config";

type ShortPublishedEmailProps = {
  userName: string;
  caption: string;
  shortId: string;
};

export function ShortPublishedEmail({
  userName,
  caption,
  shortId,
}: ShortPublishedEmailProps) {
  return (
    <EmailLayout preview={`New Short: ${caption}`} title="New Short">
      <Text
        className="email-text"
        style={{
          fontSize: "15px",
          lineHeight: "1.6",
          color: "#3d3545",
          margin: "0 0 12px",
        }}
      >
        Hi {userName},
      </Text>
      <Text
        className="email-text"
        style={{
          fontSize: "15px",
          lineHeight: "1.6",
          color: "#3d3545",
          margin: "0 0 16px",
        }}
      >
        Your church shared a new Short: <strong>{caption}</strong>
      </Text>
      <EmailButton
        href={`${emailConfig.appUrl}/shorts?short=${encodeURIComponent(shortId)}`}
        label="Watch Short"
      />
    </EmailLayout>
  );
}
