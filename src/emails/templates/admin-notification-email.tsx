import { Text } from "@react-email/components";

import { EmailButton } from "@/emails/components/email-button";
import { EmailLayout } from "@/emails/components/email-layout";

type AdminNotificationEmailProps = {
  title: string;
  summary: string;
  details?: Record<string, string>;
  actionUrl?: string;
};

export function AdminNotificationEmail({
  title,
  summary,
  details,
  actionUrl,
}: AdminNotificationEmailProps) {
  return (
    <EmailLayout preview={title} title={title}>
      <Text className="email-text" style={{ fontSize: "15px", lineHeight: "1.6", color: "#3d3545", margin: "0 0 16px" }}>
        {summary}
      </Text>
      {details ?
        Object.entries(details).map(([key, value]) => (
          <Text
            key={key}
            className="email-text"
            style={{ fontSize: "14px", lineHeight: "1.6", color: "#3d3545", margin: "0 0 6px" }}
          >
            <strong>{key}:</strong> {value}
          </Text>
        ))
      : null}
      {actionUrl ?
        <EmailButton href={actionUrl} label="View in Admin Panel" />
      : null}
    </EmailLayout>
  );
}
