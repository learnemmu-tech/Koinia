import { Text } from "@react-email/components";

import { EmailLayout } from "@/emails/components/email-layout";

type DonationThankYouEmailProps = {
  donorName: string;
  amount: string;
  donationId: string;
  date: string;
  campaignTitle: string;
};

export function DonationThankYouEmail({
  donorName,
  amount,
  donationId,
  date,
  campaignTitle,
}: DonationThankYouEmailProps) {
  return (
    <EmailLayout preview="Thank you for your generous gift" title="Thank you for your donation">
      <Text className="email-text" style={{ fontSize: "15px", lineHeight: "1.6", color: "#3d3545", margin: "0 0 12px" }}>
        Dear {donorName},
      </Text>
      <Text className="email-text" style={{ fontSize: "15px", lineHeight: "1.6", color: "#3d3545", margin: "0 0 16px" }}>
        Thank you for your generous support of <strong>{campaignTitle}</strong>.
        Your gift makes a meaningful difference in our ministry.
      </Text>
      <Text className="email-text" style={{ fontSize: "14px", lineHeight: "1.8", color: "#3d3545", margin: "0 0 8px" }}>
        <strong>Amount:</strong> {amount}
        <br />
        <strong>Donation ID:</strong> {donationId}
        <br />
        <strong>Date:</strong> {date}
      </Text>
      <Text className="email-muted" style={{ fontSize: "14px", lineHeight: "1.6", color: "#6b5f75", margin: "16px 0 0" }}>
        May God bless you abundantly for your faithfulness and generosity.
      </Text>
    </EmailLayout>
  );
}
