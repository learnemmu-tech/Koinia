import { EmailButton } from "@/emails/components/email-button";
import { EmailFacts, EmailNote, EmailText } from "@/emails/components/email-copy";
import { EmailLayout } from "@/emails/components/email-layout";
import { emailConfig } from "@/lib/email/config";

export function EventAnnouncementEmail({
  userName,
  eventTitle,
  eventDate,
  eventTime,
  location,
  description,
  eventId,
}: {
  userName: string;
  eventTitle: string;
  eventDate: string;
  eventTime?: string;
  location?: string;
  description: string;
  eventId: string;
}) {
  return (
    <EmailLayout preview={`New event: ${eventTitle}`} eyebrow="Event" title={eventTitle}>
      <EmailText>Hi {userName}, a new event has been published.</EmailText>
      <EmailFacts
        rows={[
          ["Date", eventDate],
          ["Time", eventTime],
          ["Location", location],
        ]}
      />
      {description?.trim() ? <EmailNote>{description}</EmailNote> : null}
      <EmailButton href={`${emailConfig.appUrl}/events/${eventId}`} label="View event" />
    </EmailLayout>
  );
}
