import { EmailButton } from "@/emails/components/email-button";
import { EmailNote, EmailText } from "@/emails/components/email-copy";
import { EmailLayout } from "@/emails/components/email-layout";
import { emailConfig } from "@/lib/email/config";

export function SongPublishedEmail({
  userName,
  songTitle,
  description,
  songId,
}: {
  userName: string;
  songTitle: string;
  description: string;
  songId: string;
}) {
  return (
    <EmailLayout preview={`New song: ${songTitle}`} eyebrow="Worship song" title={songTitle}>
      <EmailText>Hi {userName}, a new song is ready to listen to.</EmailText>
      {description?.trim() ? <EmailNote>{description}</EmailNote> : null}
      <EmailButton href={`${emailConfig.appUrl}/songs/${songId}`} label="Listen to song" />
    </EmailLayout>
  );
}
