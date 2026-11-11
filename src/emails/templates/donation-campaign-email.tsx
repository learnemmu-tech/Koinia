import { EmailButton } from "@/emails/components/email-button";
import { EmailFacts, EmailNote, EmailText } from "@/emails/components/email-copy";
import { EmailLayout } from "@/emails/components/email-layout";
import { emailConfig } from "@/lib/email/config";

export function DonationCampaignEmail({
  userName,
  campaignTitle,
  goalAmount,
  description,
  campaignId,
}: {
  userName: string;
  campaignTitle: string;
  goalAmount: string;
  description: string;
  campaignId: string;
}) {
  return (
    <EmailLayout preview={`New campaign: ${campaignTitle}`} eyebrow="Giving" title={campaignTitle}>
      <EmailText>Hi {userName}, a new giving campaign is open.</EmailText>
      <EmailFacts rows={[["Goal", goalAmount]]} />
      {description?.trim() ? <EmailNote>{description}</EmailNote> : null}
      <EmailButton href={`${emailConfig.appUrl}/donations/${campaignId}`} label="View campaign" />
    </EmailLayout>
  );
}
