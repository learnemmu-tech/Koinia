import { EmailButton } from "@/emails/components/email-button";
import { EmailText } from "@/emails/components/email-copy";
import { EmailLayout } from "@/emails/components/email-layout";
import { emailConfig } from "@/lib/email/config";

export function MembershipApprovedEmail({
  userName,
  churchName,
}: {
  userName: string;
  churchName: string;
}) {
  return (
    <EmailLayout
      preview={`You're a member of ${churchName}`}
      eyebrow="Membership"
      title={`Welcome to ${churchName}`}
      brand={{ name: churchName }}
    >
      <EmailText>
        Hi {userName}, your request to join {churchName} has been approved. You can now take part in the church community.
      </EmailText>
      <EmailButton href={emailConfig.appUrl} label="Open the community" />
    </EmailLayout>
  );
}
