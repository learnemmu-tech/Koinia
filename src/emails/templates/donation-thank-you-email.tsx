import { EmailFacts, EmailNote, EmailText } from "@/emails/components/email-copy";
import { EmailLayout } from "@/emails/components/email-layout";

export function DonationThankYouEmail({
  donorName,
  amount,
  donationId,
  date,
  campaignTitle,
}: {
  donorName: string;
  amount: string;
  donationId: string;
  date: string;
  campaignTitle: string;
}) {
  return (
    <EmailLayout preview="Thank you for your gift" eyebrow="Giving" title="Thank you for your gift">
      <EmailText>Dear {donorName}, your gift to {campaignTitle} has been received.</EmailText>
      <EmailFacts
        rows={[
          ["Amount", amount],
          ["Campaign", campaignTitle],
          ["Date", date],
          ["Reference", donationId],
        ]}
      />
      <EmailNote>This note confirms the gift recorded by FaithConnectHub. It is not a tax invoice.</EmailNote>
    </EmailLayout>
  );
}
