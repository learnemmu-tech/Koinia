import { Text } from "@react-email/components";

import { EmailLayout } from "@/emails/components/email-layout";
import { emailConfig } from "@/lib/email/config";

type ContactConfirmationEmailProps = {
  name: string;
  subject: string;
};

export function ContactConfirmationEmail({
  name,
  subject,
}: ContactConfirmationEmailProps) {
  return (
    <EmailLayout preview="We received your message" title="Message received">
      <Text className="email-text" style={{ fontSize: "15px", lineHeight: "1.6", color: "#3d3545", margin: "0 0 12px" }}>
        Hi {name},
      </Text>
      <Text className="email-text" style={{ fontSize: "15px", lineHeight: "1.6", color: "#3d3545", margin: "0 0 12px" }}>
        Thank you for contacting {emailConfig.appName}. We&apos;ve received your
        message regarding <strong>{subject}</strong>.
      </Text>
      <Text className="email-muted" style={{ fontSize: "14px", lineHeight: "1.6", color: "#6b5f75", margin: "0" }}>
        Our team will review your inquiry and respond as soon as possible.
      </Text>
    </EmailLayout>
  );
}
