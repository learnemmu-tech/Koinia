import { EmailButton } from "@/emails/components/email-button";
import { EmailNote, EmailText } from "@/emails/components/email-copy";
import { EmailLayout } from "@/emails/components/email-layout";
import { emailConfig } from "@/lib/email/config";

export function ArticlePublishedEmail({
  userName,
  articleTitle,
  summary,
  articleId,
}: {
  userName: string;
  articleTitle: string;
  summary: string;
  articleId: string;
}) {
  return (
    <EmailLayout preview={`New article: ${articleTitle}`} eyebrow="Article" title={articleTitle}>
      <EmailText>Hi {userName}, a new article has been published.</EmailText>
      {summary?.trim() ? <EmailNote>{summary}</EmailNote> : null}
      <EmailButton href={`${emailConfig.appUrl}/articles/${articleId}`} label="Read article" />
    </EmailLayout>
  );
}
