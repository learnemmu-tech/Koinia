import { EmailButton } from "@/emails/components/email-button";
import { EmailText } from "@/emails/components/email-copy";
import { EmailLayout } from "@/emails/components/email-layout";

export function DonationRequestNoticeEmail({
  heading,
  body,
  actionUrl,
}: {
  heading: string;
  body: string;
  actionUrl: string;
}) {
  return (
    <EmailLayout preview={heading} eyebrow="Koinia" title={heading}>
      <EmailText>{body}</EmailText>
      <EmailButton href={actionUrl} label="Open in Koinia" />
    </EmailLayout>
  );
}
