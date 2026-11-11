import { EmailButton } from "@/emails/components/email-button";
import { EmailFacts, EmailText } from "@/emails/components/email-copy";
import { EmailLayout } from "@/emails/components/email-layout";
import { emailConfig } from "@/lib/email/config";

export function SermonPublishedEmail({
  userName,
  sermonTitle,
  speaker,
  scriptureReference,
  sermonId,
}: {
  userName: string;
  sermonTitle: string;
  speaker: string;
  scriptureReference: string;
  sermonId: string;
}) {
  return (
    <EmailLayout preview={`New sermon: ${sermonTitle}`} eyebrow="Sermon" title={sermonTitle}>
      <EmailText>Hi {userName}, a new sermon is ready to watch.</EmailText>
      <EmailFacts
        rows={[
          ["Speaker", speaker],
          ["Scripture", scriptureReference],
        ]}
      />
      <EmailButton href={`${emailConfig.appUrl}/sermons/${sermonId}`} label="Watch sermon" />
    </EmailLayout>
  );
}
