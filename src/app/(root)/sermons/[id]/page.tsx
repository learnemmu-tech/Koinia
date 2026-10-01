import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RecordRecentlyViewed } from "@/components/recently-viewed/record-recently-viewed";
import { SermonDetailView } from "@/components/sermons/sermon-detail-view";
import { JsonLd } from "@/components/seo/json-ld";
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
      <SermonDetailView sermon={sermon} />
    </article>
  );
}
