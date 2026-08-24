import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleDetailView } from "@/components/articles/article-detail-view";
import { ContentAuthRequired } from "@/components/auth/content-auth-required";
import { RecordRecentlyViewed } from "@/components/recently-viewed/record-recently-viewed";
import { JsonLd } from "@/components/seo/json-ld";
import { DEFAULT_SONG_COVER } from "@/config/site";
import { isAuthenticatedServer } from "@/lib/auth-server";
import {
  getArticleNeighbors,
  getRelatedArticles,
} from "@/lib/article-utils";
import { getPageTenantContext } from "@/lib/church-page-data";
import {
  getArticleByIdCached,
  getPublishedArticlesCached,
} from "@/lib/cached-worship-data";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
} from "@/lib/seo";
import { getSongCoverUrl } from "@/lib/utils";

export const revalidate = 60;

type ArticlePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const { scope } = await getPageTenantContext();
  const article = await getArticleByIdCached(scope, decodedId);

  if (!article || !article.isPublished) {
    return { title: "Article Not Found" };
  }

  const coverUrl = getSongCoverUrl(article.coverImage) || DEFAULT_SONG_COVER;

  return buildPageMetadata({
    title: article.title,
    description: article.shortDescription,
    path: `/articles/${encodeURIComponent(decodedId)}`,
    image: coverUrl,
    imageAlt: article.title,
    type: "article",
    keywords: [article.title, "Christian article", "faith resources", article.category ?? ""].filter(
      Boolean
    ),
  });
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const callbackPath = `/articles/${encodeURIComponent(decodedId)}`;
  const isAuthenticated = await isAuthenticatedServer();

  if (!isAuthenticated) {
    return <ContentAuthRequired callbackPath={callbackPath} />;
  }

  const { scope } = await getPageTenantContext();
  const [article, allPublished] = await Promise.all([
    getArticleByIdCached(scope, decodedId),
    getPublishedArticlesCached(scope),
  ]);

  if (!article || !article.isPublished) {
    notFound();
  }

  const coverUrl = getSongCoverUrl(article.coverImage) || DEFAULT_SONG_COVER;
  const path = `/articles/${encodeURIComponent(article.id)}`;
  const { previous, next } = getArticleNeighbors(allPublished, article.id);
  const relatedArticles = getRelatedArticles(allPublished, article.id, 3);

  return (
    <article aria-label={article.title}>
      <JsonLd
        data={[
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Articles", path: "/articles" },
            { name: article.title, path },
          ]),
          buildArticleJsonLd({
            title: article.title,
            description: article.shortDescription,
            path,
            image: coverUrl,
            author: article.author,
            datePublished: new Date(article.dateCreated).toISOString(),
          }),
        ]}
      />
      <RecordRecentlyViewed itemType="article" itemId={article.id} />
      <ArticleDetailView
        article={article}
        relatedArticles={relatedArticles}
        previousArticle={previous}
        nextArticle={next}
      />
    </article>
  );
}
