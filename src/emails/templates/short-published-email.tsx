import { EmailButton } from "@/emails/components/email-button";
import { EmailText } from "@/emails/components/email-copy";
import { EmailLayout } from "@/emails/components/email-layout";
import { emailConfig } from "@/lib/email/config";

export function ShortPublishedEmail({
  userName,
  caption,
  shortId,
}: {
  userName: string;
  caption: string;
  shortId: string;
}) {
  const title =
    caption.split(/\r?\n/).map((line) => line.trim()).find(Boolean) || "New video";
  return (
    <EmailLayout preview={`New video: ${title}`} eyebrow="Video" title={title}>
      <EmailText>Hi {userName}, a new video is ready to watch.</EmailText>
      {caption.trim() && caption.trim() !== title ? <EmailText>{caption}</EmailText> : null}
      <EmailButton href={`${emailConfig.appUrl}/shorts/${shortId}`} label="Watch video" />
    </EmailLayout>
  );
}
