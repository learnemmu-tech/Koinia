import type { FirebaseArticle } from "@/types/firebase-article";

import { ArticleNavigation } from "@/components/articles/article-navigation";
import { RelatedArticles } from "@/components/articles/related-articles";
import {
  ContentDetailLayout,
  estimateReadingMinutes,
  formatDetailDate,
  type ContentDetailSidebarItem,
} from "@/components/content-detail-layout";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { YouTubeEmbed } from "@/components/media/youtube-embed";
import { ShareContentButton } from "@/components/share-content-button";
import { DEFAULT_SONG_COVER } from "@/config/site";
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
  const coverUrl = getSongCoverUrl(article.coverImage) || DEFAULT_SONG_COVER;
  const dateLabel = formatDetailDate(article.dateCreated);
  const category = article.category?.trim() || "";
  const readingMinutes = estimateReadingMinutes(article.content);
  const author = article.author?.trim() || "";
  const excerpt = article.shortDescription?.trim() || "";
  const scripture = article.scriptureReference?.trim() || "";
  const hasVideo = Boolean(article.youtubeUrl?.trim());

  const metadata = [
    dateLabel,
    category || null,
    readingMinutes ? `${readingMinutes} min read` : null,
  ].filter(Boolean) as string[];

  const sidebarItems: ContentDetailSidebarItem[] = [];
  if (author) {
    sidebarItems.push({ label: "Author", value: author, icon: "user" });
  }
  if (dateLabel) {
    sidebarItems.push({ label: "Date", value: dateLabel, icon: "calendar" });
  }
  if (category) {
    sidebarItems.push({ label: "Category", value: category, icon: "tag" });
  }
  if (readingMinutes) {
    sidebarItems.push({
      label: "Reading",
      value: `${readingMinutes} min`,
      icon: "clock",
    });
  }
  if (scripture) {
    sidebarItems.push({
      label: "Scripture",
      value: scripture,
      icon: "book",
    });
  }

  return (
    <ContentDetailLayout
      kind="article"
      kindLabel="Article"
      backLabel="Back to Articles"
      backHref="/articles"
      coverUrl={coverUrl}
      coverAlt={article.title}
      title={article.title}
      author={author || undefined}
      authorImage={article.authorImage}
      metadata={metadata}
      excerpt={excerpt || undefined}
      content={article.content}
      sidebarTitle="About this article"
      sidebarItems={sidebarItems}
      scriptureReference={scripture || undefined}
      tags={article.tags}
      hasMedia={hasVideo}
      headerAction={
        <ShareContentButton
          title={article.title}
          description={excerpt || undefined}
          path={`/articles/${encodeURIComponent(article.id)}`}
          className="h-9 rounded-xl px-4"
          label="Share"
        />
      }
      heroActions={
        <FavoriteButton
          itemType="article"
          itemId={article.id}
          appearance="button"
        />
      }
      media={
        hasVideo ?
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
            <div className="aspect-video w-full">
              <YouTubeEmbed
                title={article.title}
                youtubeUrl={article.youtubeUrl}
                framed={false}
              />
            </div>
          </div>
        : null
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
