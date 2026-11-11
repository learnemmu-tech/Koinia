import { EmailButton } from "@/emails/components/email-button";
import { EmailText } from "@/emails/components/email-copy";
import { EmailLayout } from "@/emails/components/email-layout";

export function GroupInvitationEmail({
  userName,
  inviterName,
  groupName,
  churchName,
  actionUrl,
}: {
  userName: string;
  inviterName: string;
  groupName: string;
  churchName: string;
  actionUrl: string;
}) {
  return (
    <EmailLayout
      preview={`${inviterName} invited you to ${groupName}`}
      eyebrow="Community"
      title={`Join ${groupName}`}
      brand={{ name: churchName }}
    >
      <EmailText>
        Hi {userName}, {inviterName} invited you to join {groupName} at {churchName}.
      </EmailText>
      <EmailButton href={actionUrl} label="View invitation" />
    </EmailLayout>
  );
}
