import { Text } from "@react-email/components";

import { EmailButton } from "@/emails/components/email-button";
import { EmailLayout } from "@/emails/components/email-layout";
import { emailConfig } from "@/lib/email/config";

type ArticlePublishedEmailProps = {
  userName: string;
  articleTitle: string;
  summary: string;
  articleId: string;
};

export function ArticlePublishedEmail({
  userName,
  articleTitle,
  summary,
  articleId,
}: ArticlePublishedEmailProps) {
  return (
    <EmailLayout preview={`New article: ${articleTitle}`} title="New article">
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
        A new article has been published: <strong>{articleTitle}</strong>
      </Text>
      {summary ?
        <Text
          className="email-text"
          style={{
            fontSize: "14px",
            lineHeight: "1.7",
            color: "#3d3545",
            margin: "0 0 16px",
          }}
        >
          {summary}
        </Text>
      : null}
      <EmailButton
        href={`${emailConfig.appUrl}/articles/${articleId}`}
        label="Read Article"
      />
    </EmailLayout>
  );
}
