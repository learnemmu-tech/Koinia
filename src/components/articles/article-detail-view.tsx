import type { FirebaseArticle } from "@/types/firebase-article";

import { ArticleNavigation } from "@/components/articles/article-navigation";
import { RelatedArticles } from "@/components/articles/related-articles";
import { YouTubeEmbed } from "@/components/media/youtube-embed";
import { ReadingDetailLayout } from "@/components/reading-detail-layout";
import { ShareContentButton } from "@/components/share-content-button";
import { getSongCoverUrl } from "@/lib/utils";

type ArticleDetailViewProps = {
  article: FirebaseArticle;
  relatedArticles: FirebaseArticle[];
  previousArticle: FirebaseArticle | null;
  nextArticle: FirebaseArticle | null;
};

export function ArticleDetailView({
  article,
  relatedArticles,
  previousArticle,
  nextArticle,
}: ArticleDetailViewProps) {
  const coverUrl = getSongCoverUrl(article.coverImage);
  const headerSubtitle = article.scriptureReference
    ? `${article.shortDescription} · ${article.scriptureReference}`
    : article.shortDescription;

  return (
    <ReadingDetailLayout
      coverUrl={coverUrl}
      coverAlt={article.title}
      category={article.category}
      title={article.title}
      subtitle={headerSubtitle}
      author={article.author}
      authorImage={article.authorImage}
      dateCreated={article.dateCreated}
      content={article.content}
      beforeContent={
        <YouTubeEmbed title={article.title} youtubeUrl={article.youtubeUrl} />
      }
      headerAction={
        <ShareContentButton
          title={article.title}
          description={article.shortDescription}
          path={`/articles/${encodeURIComponent(article.id)}`}
        />
      }
      footer={
        <>
          <ArticleNavigation previous={previousArticle} next={nextArticle} />
          <RelatedArticles articles={relatedArticles} />
        </>
      }
    />
  );
}
