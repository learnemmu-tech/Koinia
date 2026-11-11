import { EmailButton } from "@/emails/components/email-button";
import { EmailNote, EmailText } from "@/emails/components/email-copy";
import { EmailLayout } from "@/emails/components/email-layout";

export function InvitationEmail({ role, inviteLink }: { role: string; inviteLink: string }) {
  return (
    <EmailLayout preview="You're invited to join FaithConnectHub" eyebrow="Invitation" title="You're invited">
      <EmailText>
        A church administrator invited you to join their workspace on FaithConnectHub as {role}.
      </EmailText>
      <EmailNote>This invitation link expires in 14 days. If you were not expecting it, you can ignore this email.</EmailNote>
      <EmailButton href={inviteLink} label="Accept invitation" />
    </EmailLayout>
  );
}
