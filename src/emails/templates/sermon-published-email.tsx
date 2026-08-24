import { Text } from "@react-email/components";

import { EmailButton } from "@/emails/components/email-button";
import { EmailLayout } from "@/emails/components/email-layout";
import { emailConfig } from "@/lib/email/config";

type SermonPublishedEmailProps = {
  userName: string;
  sermonTitle: string;
  speaker: string;
  scriptureReference: string;
  sermonId: string;
};

export function SermonPublishedEmail({
  userName,
  sermonTitle,
  speaker,
  scriptureReference,
  sermonId,
}: SermonPublishedEmailProps) {
  return (
    <EmailLayout preview={`New sermon: ${sermonTitle}`} title="New sermon">
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
        A new sermon is available: <strong>{sermonTitle}</strong>
      </Text>
      <Text
        className="email-text"
        style={{
          fontSize: "14px",
          lineHeight: "1.8",
          color: "#3d3545",
          margin: "0 0 16px",
        }}
      >
        <strong>Pastor:</strong> {speaker}
        <br />
        <strong>Scripture:</strong> {scriptureReference}
      </Text>
      <EmailButton
        href={`${emailConfig.appUrl}/sermons/${sermonId}`}
        label="Watch / Read"
      />
    </EmailLayout>
  );
}
