import { Text } from "@react-email/components";

import { EmailButton } from "@/emails/components/email-button";
import { EmailLayout } from "@/emails/components/email-layout";
import { emailConfig } from "@/lib/email/config";

type EventRegistrationEmailProps = {
  userName: string;
  eventTitle: string;
  eventDate: string;
  eventTime?: string;
  location?: string;
  eventId: string;
};

export function EventRegistrationEmail({
  userName,
  eventTitle,
  eventDate,
  eventTime,
  location,
  eventId,
}: EventRegistrationEmailProps) {
  return (
    <EmailLayout
      preview={`You're registered for ${eventTitle}`}
      title="Event registration confirmed"
    >
      <Text className="email-text" style={{ fontSize: "15px", lineHeight: "1.6", color: "#3d3545", margin: "0 0 12px" }}>
        Hi {userName},
      </Text>
      <Text className="email-text" style={{ fontSize: "15px", lineHeight: "1.6", color: "#3d3545", margin: "0 0 16px" }}>
        You&apos;re registered for <strong>{eventTitle}</strong>. We look forward
        to seeing you there!
      </Text>
      <Text className="email-text" style={{ fontSize: "14px", lineHeight: "1.8", color: "#3d3545", margin: "0 0 8px" }}>
        <strong>Date:</strong> {eventDate}
        {eventTime ? (
          <>
            <br />
            <strong>Time:</strong> {eventTime}
          </>
        ) : null}
        {location ? (
          <>
            <br />
            <strong>Location:</strong> {location}
          </>
        ) : null}
      </Text>
      <EmailButton
        href={`${emailConfig.appUrl}/events/${eventId}`}
        label="View Event Details"
      />
    </EmailLayout>
  );
}
