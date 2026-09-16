import { Text } from "@react-email/components";

import { EmailButton } from "@/emails/components/email-button";
import { EmailLayout } from "@/emails/components/email-layout";

export function TrialLifecycleEmail({
  title,
  message,
  actionLabel,
  actionUrl,
}: {
  title: string;
  message: string;
  actionLabel: string;
  actionUrl: string;
}) {
  return (
    <EmailLayout preview={title} title={title}>
      <Text
        className="email-text"
        style={{ fontSize: "15px", lineHeight: "1.6", color: "#3d3545", margin: "0 0 16px" }}
      >
        {message}
      </Text>
      <EmailButton href={actionUrl} label={actionLabel} />
    </EmailLayout>
  );
}