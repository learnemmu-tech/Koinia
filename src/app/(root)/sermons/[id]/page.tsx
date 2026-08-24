import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentAuthRequired } from "@/components/auth/content-auth-required";
import { RecordRecentlyViewed } from "@/components/recently-viewed/record-recently-viewed";
import { ReadingDetailLayout } from "@/components/reading-detail-layout";
import { SermonMediaSection } from "@/components/sermons/sermon-media-section";
import { JsonLd } from "@/components/seo/json-ld";
import { ShareContentButton } from "@/components/share-content-button";
import { isAuthenticatedServer } from "@/lib/auth-server";
import { getPageTenantContext } from "@/lib/church-page-data";
import { getSermonByIdCached } from "@/lib/cached-worship-data";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
} from "@/lib/seo";
import { getSongCoverUrl } from "@/lib/utils";

export const revalidate = 60;

type SermonPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: SermonPageProps): Promise<Metadata> {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const { scope } = await getPageTenantContext();
  const sermon = await getSermonByIdCached(scope, decodedId);

  if (!sermon || !sermon.isPublished) {
    return { title: "Sermon Not Found" };
  }

  const coverUrl = getSongCoverUrl(sermon.coverImage);

  return buildPageMetadata({
    title: sermon.title,
    description: sermon.shortDescription.slice(0, 160),
    path: `/sermons/${encodeURIComponent(decodedId)}`,
    image: coverUrl,
    imageAlt: sermon.title,
    type: "article",
    keywords: [
      sermon.title,
      "Christian sermon",
      "biblical teaching",
      sermon.scriptureReference ?? "",
    ].filter(Boolean),
  });
}

export default async function SermonPage({ params }: SermonPageProps) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const callbackPath = `/sermons/${encodeURIComponent(decodedId)}`;
  const isAuthenticated = await isAuthenticatedServer();

  if (!isAuthenticated) {
    return <ContentAuthRequired callbackPath={callbackPath} />;
  }

  const { scope } = await getPageTenantContext();
  const sermon = await getSermonByIdCached(scope, decodedId);

  if (!sermon || !sermon.isPublished) {
    notFound();
  }

  const coverUrl = getSongCoverUrl(sermon.coverImage);
  const path = `/sermons/${encodeURIComponent(sermon.id)}`;

  return (
    <article aria-label={sermon.title}>
      <JsonLd
        data={[
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Sermons", path: "/sermons" },
            { name: sermon.title, path },
          ]),
          buildArticleJsonLd({
            title: sermon.title,
            description: sermon.shortDescription,
            path,
            image: coverUrl,
            author: sermon.speaker,
            datePublished: new Date(sermon.dateCreated).toISOString(),
          }),
        ]}
      />
      <RecordRecentlyViewed itemType="sermon" itemId={sermon.id} />
      <ReadingDetailLayout
        coverUrl={coverUrl}
        coverAlt={sermon.title}
        category={sermon.scriptureReference || undefined}
        title={sermon.title}
        subtitle={sermon.subtitle}
        shortDescription={sermon.shortDescription}
        author={sermon.speaker}
        dateCreated={sermon.dateCreated}
        content={sermon.content}
        beforeContent={
          <SermonMediaSection
            title={sermon.title}
            youtubeUrl={sermon.youtubeUrl}
            audioUrl={sermon.audioUrl}
          />
        }
        headerAction={
          <ShareContentButton
            title={sermon.title}
            description={sermon.shortDescription}
            path={path}
          />
        }
      />
    </article>
  );
}
