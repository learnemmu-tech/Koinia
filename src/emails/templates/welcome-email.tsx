import { Text } from "@react-email/components";

import { EmailButton } from "@/emails/components/email-button";
import { EmailLayout } from "@/emails/components/email-layout";
import { emailConfig } from "@/lib/email/config";

type WelcomeEmailProps = {
  userName: string;
};

export function WelcomeEmail({ userName }: WelcomeEmailProps) {
  return (
    <EmailLayout preview={`Welcome to ${emailConfig.appName}`} title={`Welcome, ${userName}!`}>
      <Text className="email-text" style={{ fontSize: "15px", lineHeight: "1.6", color: "#3d3545", margin: "0 0 16px" }}>
        We&apos;re glad you joined {emailConfig.appName} — a Christian worship and
        ministry platform for songs, sermons, articles, prayer requests, events,
        and giving.
      </Text>
      <Text className="email-muted" style={{ fontSize: "14px", lineHeight: "1.6", color: "#6b5f75", margin: "0 0 20px" }}>
        Explore worship content, share prayer requests with the community, and
        stay connected with your church.
      </Text>
      <EmailButton href={emailConfig.appUrl} label="Explore FaithConnectHub" />
    </EmailLayout>
  );
}
