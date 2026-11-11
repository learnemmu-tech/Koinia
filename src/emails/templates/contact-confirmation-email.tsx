import { EmailNote, EmailText } from "@/emails/components/email-copy";
import { EmailLayout } from "@/emails/components/email-layout";
import { emailConfig } from "@/lib/email/config";

export function ContactConfirmationEmail({ name, subject }: { name: string; subject: string }) {
  return (
    <EmailLayout preview="We received your message" eyebrow="Contact" title="We received your message">
      <EmailText>Hi {name}, thank you for writing to {emailConfig.appName} about {subject}.</EmailText>
      <EmailNote>Someone from the team will reply to this address. You do not need to send the message again.</EmailNote>
    </EmailLayout>
  );
}
