import { Text } from "@react-email/components";

import { EmailButton } from "@/emails/components/email-button";
import { EmailLayout } from "@/emails/components/email-layout";
import { emailConfig } from "@/lib/email/config";

type SongPublishedEmailProps = {
  userName: string;
  songTitle: string;
  description: string;
  songId: string;
};

export function SongPublishedEmail({
  userName,
  songTitle,
  description,
  songId,
}: SongPublishedEmailProps) {
  return (
    <EmailLayout preview={`New song: ${songTitle}`} title="New worship song">
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
        A new song has been published: <strong>{songTitle}</strong>
      </Text>
      {description ?
        <Text
          className="email-text"
          style={{
            fontSize: "14px",
            lineHeight: "1.7",
            color: "#3d3545",
            margin: "0 0 16px",
          }}
        >
          {description}
        </Text>
      : null}
      <EmailButton
        href={`${emailConfig.appUrl}/songs/${songId}`}
        label="Listen Now"
      />
    </EmailLayout>
  );
}
