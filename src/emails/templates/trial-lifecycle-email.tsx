import { EmailButton } from "@/emails/components/email-button";
import { EmailText } from "@/emails/components/email-copy";
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
    <EmailLayout preview={title} eyebrow="Trial" title={title}>
      <EmailText>{message}</EmailText>
      <EmailButton href={actionUrl} label={actionLabel} />
    </EmailLayout>
  );
}
