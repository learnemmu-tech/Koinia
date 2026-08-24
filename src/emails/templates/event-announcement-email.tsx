import { Text } from "@react-email/components";

import { EmailButton } from "@/emails/components/email-button";
import { EmailLayout } from "@/emails/components/email-layout";
import { emailConfig } from "@/lib/email/config";

type EventAnnouncementEmailProps = {
  userName: string;
  eventTitle: string;
  eventDate: string;
  eventTime?: string;
  location?: string;
  description: string;
  eventId: string;
};

export function EventAnnouncementEmail({
  userName,
  eventTitle,
  eventDate,
  eventTime,
  location,
  description,
  eventId,
}: EventAnnouncementEmailProps) {
  const preview = `New event: ${eventTitle}`;

  return (
    <EmailLayout preview={preview} title="New ministry event">
      <Text
        className="email-text"
        style={{
          fontSize: "15px",
          lineHeight: "1.6",
          color: "#3d3545",
          margin: "0 0 12px",
        }}
      >
        Hi {userName},
      </Text>
      <Text
        className="email-text"
        style={{
          fontSize: "15px",
          lineHeight: "1.6",
          color: "#3d3545",
          margin: "0 0 16px",
        }}
      >
        A new event has been published on FaithConnectHub:{" "}
        <strong>{eventTitle}</strong>
      </Text>
      <Text
        className="email-text"
        style={{
          fontSize: "14px",
          lineHeight: "1.8",
          color: "#3d3545",
          margin: "0 0 8px",
        }}
      >
        <strong>Date:</strong> {eventDate}
        {eventTime ?
          <>
            <br />
            <strong>Time:</strong> {eventTime}
          </>
        : null}
        {location ?
          <>
            <br />
            <strong>Location:</strong> {location}
          </>
        : null}
      </Text>
      {description ?
        <Text
          className="email-text"
          style={{
            fontSize: "14px",
            lineHeight: "1.7",
            color: "#3d3545",
            margin: "12px 0 16px",
            whiteSpace: "pre-wrap",
          }}
        >
          {description}
        </Text>
      : null}
      <EmailButton
        href={`${emailConfig.appUrl}/events/${eventId}`}
        label="Register Now"
      />
    </EmailLayout>
  );
}
