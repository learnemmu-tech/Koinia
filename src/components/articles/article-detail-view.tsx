import { useTranslations } from "next-intl";

import type { FirebaseArticle } from "@/types/firebase-article";

import { ArticleNavigation } from "@/components/articles/article-navigation";
import { RelatedArticles } from "@/components/articles/related-articles";
import {
  ContentDetailLayout,
  estimateReadingMinutes,
  formatDetailDate,
  type ContentDetailSidebarItem,
} from "@/components/content-detail-layout";
import { ContentActions } from "@/components/engagement/content-actions";
import { YouTubeEmbed } from "@/components/media/youtube-embed";
import { ShareContentButton } from "@/components/share-content-button";
import { DEFAULT_SONG_COVER } from "@/config/site";
import { contentItemHref } from "@/lib/content/item-href";
import { getSongCoverUrl } from "@/lib/utils";

type ArticleDetailViewProps = {
  article: FirebaseArticle;
  relatedArticles: FirebaseArticle[];
  previousArticle: FirebaseArticle | null;
  nextArticle: FirebaseArticle | null;
  hrefPrefix?: string;
};

export function ArticleDetailView({
  article,
  relatedArticles,
  previousArticle,
  nextArticle,
  hrefPrefix = "/articles",
}: ArticleDetailViewProps) {
  const t = useTranslations("articles");
  const tCommon = useTranslations("common");
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
    readingMinutes ? t("minRead", { count: readingMinutes }) : null,
  ].filter(Boolean) as string[];

  const sidebarItems: ContentDetailSidebarItem[] = [];
  if (author) {
    sidebarItems.push({ label: t("author"), value: author, icon: "user" });
  }
  if (dateLabel) {
    sidebarItems.push({ label: t("date"), value: dateLabel, icon: "calendar" });
  }
  if (category) {
    sidebarItems.push({ label: t("categoryLabel"), value: category, icon: "tag" });
  }
  if (readingMinutes) {
    sidebarItems.push({
      label: t("reading"),
      value: t("minutes", { count: readingMinutes }),
      icon: "clock",
    });
  }
  if (scripture) {
    sidebarItems.push({
      label: t("scripture"),
      value: scripture,
      icon: "book",
    });
  }

  return (
    <ContentDetailLayout
      kind="article"
      kindLabel={t("kind")}
      backLabel={t("back")}
      backHref={hrefPrefix}
      coverUrl={coverUrl}
      coverAlt={article.title}
      title={article.title}
      author={author || undefined}
      authorImage={article.authorImage}
      metadata={metadata}
      excerpt={excerpt || undefined}
      content={article.content}
      sidebarTitle={t("about")}
      sidebarItems={sidebarItems}
      scriptureReference={scripture || undefined}
      tags={article.tags}
      hasMedia={hasVideo}
      headerAction={
        <ShareContentButton
          title={article.title}
          description={excerpt || undefined}
          path={contentItemHref(hrefPrefix, article.id)}
          className="h-9 rounded-xl px-4"
          label={tCommon("share")}
        />
      }
      heroActions={
        <ContentActions
          likeType="article"
          itemId={article.id}
          saveType="article"
          layout="detail"
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
          <ArticleNavigation
            previous={previousArticle}
            next={nextArticle}
            hrefPrefix={hrefPrefix}
          />
          <RelatedArticles articles={relatedArticles} hrefPrefix={hrefPrefix} />
        </>
      }
    />
  );
}
