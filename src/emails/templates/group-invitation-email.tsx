import { Text } from "@react-email/components";

import { EmailButton } from "@/emails/components/email-button";
import { EmailLayout } from "@/emails/components/email-layout";
import { emailConfig } from "@/lib/email/config";

type GroupInvitationEmailProps = {
  userName: string;
  inviterName: string;
  groupName: string;
  churchName: string;
  actionUrl: string;
};

export function GroupInvitationEmail({
  userName,
  inviterName,
  groupName,
  churchName,
  actionUrl,
}: GroupInvitationEmailProps) {
  return (
    <EmailLayout
      preview={`You're invited to join ${groupName}`}
      title={`You're invited to join ${groupName}`}
    >
      <Text
        className="email-text"
        style={{
          fontSize: "15px",
          lineHeight: "1.6",
          color: "#3d3545",
          margin: "0 0 16px",
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
        {inviterName} invited you to join <strong>{groupName}</strong> at{" "}
        <strong>{churchName}</strong> on {emailConfig.appName}.
      </Text>
      <EmailButton href={actionUrl} label="View Invitation" />
    </EmailLayout>
  );
}
