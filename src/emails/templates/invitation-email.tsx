import { Text } from "@react-email/components";

import { EmailButton } from "@/emails/components/email-button";
import { EmailLayout } from "@/emails/components/email-layout";

type InvitationEmailProps = {
  role: string;
  inviteLink: string;
};

export function InvitationEmail({ role, inviteLink }: InvitationEmailProps) {
  return (
    <EmailLayout
      preview="You're invited to join FaithConnectHub"
      title="You're invited"
    >
      <Text
        className="email-text"
        style={{ fontSize: "15px", lineHeight: "1.6", color: "#3d3545", margin: "0 0 16px" }}
      >
        You have been invited to join your church on FaithConnectHub as{" "}
        <strong>{role}</strong>.
      </Text>
      <Text
        className="email-muted"
        style={{ fontSize: "14px", lineHeight: "1.6", color: "#6b5f75", margin: "0 0 20px" }}
      >
        This invitation link expires in 14 days.
      </Text>
      <EmailButton href={inviteLink} label="Accept invitation" />
    </EmailLayout>
  );
}
