import { EmailButton } from "@/emails/components/email-button";
import { EmailFacts, EmailText } from "@/emails/components/email-copy";
import { EmailLayout } from "@/emails/components/email-layout";
import { emailConfig } from "@/lib/email/config";

export function EventRegistrationEmail({
  userName,
  eventTitle,
  eventDate,
  eventTime,
  location,
  eventId,
}: {
  userName: string;
  eventTitle: string;
  eventDate: string;
  eventTime?: string;
  location?: string;
  eventId: string;
}) {
  return (
    <EmailLayout
      preview={`You're registered for ${eventTitle}`}
      eyebrow="Registration"
      title="You're registered"
    >
      <EmailText>Hi {userName}, your registration for {eventTitle} is confirmed.</EmailText>
      <EmailFacts
        rows={[
          ["Event", eventTitle],
          ["Date", eventDate],
          ["Time", eventTime],
          ["Location", location],
        ]}
      />
      <EmailButton href={`${emailConfig.appUrl}/events/${eventId}`} label="View event" />
    </EmailLayout>
  );
}
