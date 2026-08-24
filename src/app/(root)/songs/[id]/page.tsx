import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentAuthRequired } from "@/components/auth/content-auth-required";
import { SongDetailClient } from "@/components/music/song-detail-client";
import { JsonLd } from "@/components/seo/json-ld";
import { DEFAULT_SONG_COVER } from "@/config/site";
import { isAuthenticatedServer } from "@/lib/auth-server";
import { getPageTenantContext } from "@/lib/church-page-data";
import { getSongByIdCached } from "@/lib/cached-worship-data";
import {
  buildBreadcrumbJsonLd,
  buildMusicRecordingJsonLd,
  buildPageMetadata,
} from "@/lib/seo";
import {
  getSongAlternateTitle,
  getSongDisplayTitle,
  isSongPublished,
} from "@/lib/song-firestore";
import { getSongCoverUrl } from "@/lib/utils";

export const revalidate = 60;

type SongDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: SongDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const { scope } = await getPageTenantContext();
  const song = await getSongByIdCached(scope, id);

  if (!song) {
    return { title: "Song Not Found" };
  }

  const displayTitle = getSongDisplayTitle(song);
  const alternateTitle = getSongAlternateTitle(song) ?? "";
  const coverUrl = getSongCoverUrl(song.imageUrl) || DEFAULT_SONG_COVER;
  const description =
    alternateTitle && alternateTitle !== displayTitle ?
      `${alternateTitle} — Christian worship song with lyrics on FaithConnectHub.`
    : `${displayTitle} — Christian worship song with lyrics on FaithConnectHub.`;

  return buildPageMetadata({
    title: displayTitle,
    description,
    path: `/songs/${encodeURIComponent(id)}`,
    image: coverUrl,
    imageAlt: displayTitle,
    imageWidth: 800,
    imageHeight: 800,
    type: "music.song",
    keywords: [
      displayTitle,
      "worship song",
      "Christian lyrics",
      song.category,
      ...(song.tags ?? []),
    ],
  });
}

export default async function SongDetailPage({ params }: SongDetailPageProps) {
  const { id } = await params;
  const callbackPath = `/songs/${encodeURIComponent(id)}`;
  const isAuthenticated = await isAuthenticatedServer();

  if (!isAuthenticated) {
    return <ContentAuthRequired callbackPath={callbackPath} />;
  }

  const { scope } = await getPageTenantContext();
  const song = await getSongByIdCached(scope, id);

  if (!song || !isSongPublished(song)) {
    notFound();
  }

  const displayTitle = getSongDisplayTitle(song);
  const coverUrl = getSongCoverUrl(song.imageUrl) || DEFAULT_SONG_COVER;
  const path = `/songs/${encodeURIComponent(id)}`;

  return (
    <article aria-label={displayTitle}>
      <JsonLd
        data={[
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Songs", path: "/songs" },
            { name: displayTitle, path },
          ]),
          buildMusicRecordingJsonLd({
            title: displayTitle,
            description: `${displayTitle} — worship song on FaithConnectHub`,
            path,
            image: coverUrl,
            artist: song.artist,
          }),
        ]}
      />
      <SongDetailClient song={song} />
    </article>
  );
}
