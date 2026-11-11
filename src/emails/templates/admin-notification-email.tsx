import { EmailButton } from "@/emails/components/email-button";
import { EmailFacts, EmailText } from "@/emails/components/email-copy";
import { EmailLayout } from "@/emails/components/email-layout";

export function AdminNotificationEmail({
  title,
  summary,
  details,
  actionUrl,
}: {
  title: string;
  summary: string;
  details?: Record<string, string>;
  actionUrl?: string;
}) {
  return (
    <EmailLayout preview={title} eyebrow="Admin" title={title}>
      <EmailText>{summary}</EmailText>
      {details ? (
        <EmailFacts rows={Object.entries(details).map(([label, value]) => [label, value])} />
      ) : null}
      {actionUrl ? <EmailButton href={actionUrl} label="Open in FaithConnectHub" /> : null}
    </EmailLayout>
  );
}
