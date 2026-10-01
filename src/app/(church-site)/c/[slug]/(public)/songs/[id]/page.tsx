import { notFound } from "next/navigation";

import { SongDetailClient } from "@/components/music/song-detail-client";
import { getPublishedSongForChurch } from "@/lib/templates/public-content";
import { churchWebsitePath } from "@/lib/templates/paths";
import { requireChurchWebsite } from "@/lib/templates/require-church-website";
import { HeritageDetailFrame } from "@/templates/heritage/components/heritage-content-frame";

export const dynamic = "force-dynamic";

export default async function ChurchSongDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const { model } = await requireChurchWebsite(slug);
  const item = await getPublishedSongForChurch(
    decodeURIComponent(id),
    model.church.id,
    model.church.organizationId
  );
  if (!item) notFound();

  const listHref = churchWebsitePath(model.church.slug, "/songs");

  if (model.templateId === "heritage") {
    return (
      <HeritageDetailFrame>
        <SongDetailClient song={item} listHref={listHref} />
      </HeritageDetailFrame>
    );
  }

  return <SongDetailClient song={item} listHref={listHref} />;
}
