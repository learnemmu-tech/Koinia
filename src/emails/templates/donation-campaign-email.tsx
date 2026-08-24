import { Text } from "@react-email/components";

import { EmailButton } from "@/emails/components/email-button";
import { EmailLayout } from "@/emails/components/email-layout";
import { emailConfig } from "@/lib/email/config";

type DonationCampaignEmailProps = {
  userName: string;
  campaignTitle: string;
  goalAmount: string;
  description: string;
  campaignId: string;
};

export function DonationCampaignEmail({
  userName,
  campaignTitle,
  goalAmount,
  description,
  campaignId,
}: DonationCampaignEmailProps) {
  return (
    <EmailLayout
      preview={`New campaign: ${campaignTitle}`}
      title="New giving campaign"
    >
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
        A new donation campaign is live: <strong>{campaignTitle}</strong>
      </Text>
      <Text
        className="email-text"
        style={{
          fontSize: "14px",
          lineHeight: "1.8",
          color: "#3d3545",
          margin: "0 0 8px",
        }}
      >
        <strong>Goal:</strong> {goalAmount}
      </Text>
      {description ?
        <Text
          className="email-text"
          style={{
            fontSize: "14px",
            lineHeight: "1.7",
            color: "#3d3545",
            margin: "0 0 16px",
            whiteSpace: "pre-wrap",
          }}
        >
          {description}
        </Text>
      : null}
      <EmailButton
        href={`${emailConfig.appUrl}/donations/${campaignId}`}
        label="Donate Now"
      />
    </EmailLayout>
  );
}
