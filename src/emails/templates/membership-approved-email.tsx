import { Text } from "@react-email/components";

import { EmailButton } from "@/emails/components/email-button";
import { EmailLayout } from "@/emails/components/email-layout";
import { emailConfig } from "@/lib/email/config";

type MembershipApprovedEmailProps = {
  userName: string;
  churchName: string;
};

export function MembershipApprovedEmail({
  userName,
  churchName,
}: MembershipApprovedEmailProps) {
  return (
    <EmailLayout
      preview={`You're approved to join ${churchName}`}
      title="Welcome to the church!"
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
        Your request to join <strong>{churchName}</strong> has been approved.
        Welcome!
      </Text>
      <Text
        className="email-muted"
        style={{
          fontSize: "14px",
          lineHeight: "1.6",
          color: "#6b5f75",
          margin: "0 0 20px",
        }}
      >
        You can now access your church dashboard, worship content, events, and
        more on {emailConfig.appName}.
      </Text>
      <EmailButton href={`${emailConfig.appUrl}/dashboard`} label="Go to Dashboard" />
    </EmailLayout>
  );
}
