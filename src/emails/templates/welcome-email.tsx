import { EmailButton } from "@/emails/components/email-button";
import { EmailNote, EmailText } from "@/emails/components/email-copy";
import { EmailLayout } from "@/emails/components/email-layout";
import { emailConfig } from "@/lib/email/config";

export function WelcomeEmail({ userName }: { userName: string }) {
  return (
    <EmailLayout
      preview={`Welcome to ${emailConfig.appName}`}
      eyebrow="Welcome"
      title={`Welcome, ${userName}`}
    >
      <EmailText>
        You now have a place on {emailConfig.appName} for worship, teaching, prayer, and the life of your church.
      </EmailText>
      <EmailNote>Open the app to find songs, sermons, events, and your church community.</EmailNote>
      <EmailButton href={emailConfig.appUrl} label="Open FaithConnectHub" />
    </EmailLayout>
  );
}
