import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  ContentDetailLayout,
  ContentListenWatchLink,
  formatDetailDate,
  type ContentDetailSidebarItem,
} from "@/components/content-detail-layout";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { RecordRecentlyViewed } from "@/components/recently-viewed/record-recently-viewed";
import { SermonMediaSection } from "@/components/sermons/sermon-media-section";
import { JsonLd } from "@/components/seo/json-ld";
import { ShareContentButton } from "@/components/share-content-button";
import { resolvePageContentQuery } from "@/lib/content/page-content-query";
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
  const { contentQuery } = await resolvePageContentQuery();
  const sermon = await getSermonByIdCached(contentQuery, decodedId);

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
  const { contentQuery } = await resolvePageContentQuery();
  const sermon = await getSermonByIdCached(contentQuery, decodedId);

  if (!sermon || !sermon.isPublished) {
    notFound();
  }

  const coverUrl = getSongCoverUrl(sermon.coverImage);
  const path = `/sermons/${encodeURIComponent(sermon.id)}`;
  const dateLabel = formatDetailDate(sermon.dateCreated);
  const speaker = sermon.speaker?.trim() || "";
  const scripture = sermon.scriptureReference?.trim() || "";
  const excerpt = sermon.shortDescription?.trim() || "";
  const hasVideo = Boolean(sermon.youtubeUrl?.trim());
  const hasAudio = Boolean(sermon.audioUrl?.trim());
  const hasMedia = hasVideo || hasAudio;

  const metadata = [dateLabel, scripture || null].filter(Boolean) as string[];

  const sidebarItems: ContentDetailSidebarItem[] = [];
  if (dateLabel) {
    sidebarItems.push({ label: "Date", value: dateLabel, icon: "calendar" });
  }
  if (scripture) {
    sidebarItems.push({ label: "Scripture", value: scripture, icon: "book" });
  }
  if (speaker) {
    sidebarItems.push({ label: "Speaker", value: speaker, icon: "user" });
  }

  const listenLabel =
    hasVideo && hasAudio ? "Listen / Watch"
    : hasVideo ? "Watch Sermon"
    : "Listen to Sermon";

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
      <ContentDetailLayout
        kind="sermon"
        kindLabel="Sermon"
        backLabel="Back to Sermons"
        backHref="/sermons"
        coverUrl={coverUrl}
        coverAlt={sermon.title}
        title={sermon.title}
        author={speaker || undefined}
        metadata={metadata}
        excerpt={excerpt || sermon.subtitle?.trim() || undefined}
        content={sermon.content}
        contentHeading={sermon.content.trim() ? "Notes" : undefined}
        sidebarTitle="About this sermon"
        sidebarItems={sidebarItems}
        scriptureReference={scripture || undefined}
        tags={sermon.tags}
        hasMedia={hasMedia}
        showPlayAffordance={hasMedia}
        headerAction={
          <ShareContentButton
            title={sermon.title}
            description={excerpt || undefined}
            path={path}
            className="h-9 rounded-xl px-4"
            label="Share"
          />
        }
        heroActions={
          <>
            {hasMedia ? <ContentListenWatchLink label={listenLabel} /> : null}
            <FavoriteButton
              itemType="sermon"
              itemId={sermon.id}
              appearance="button"
            />
          </>
        }
        media={
          hasMedia ?
            <SermonMediaSection
              title={sermon.title}
              youtubeUrl={sermon.youtubeUrl}
              audioUrl={sermon.audioUrl}
            />
          : null
        }
      />
    </article>
  );
}
