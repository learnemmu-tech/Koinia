import { notFound } from "next/navigation";

import { getPublishedSermonForChurch } from "@/lib/templates/public-content";
import { requireVisibleChurchWebsite } from "@/lib/templates/require-church-website";

export const dynamic = "force-dynamic";

export default async function SermonDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const { model, pages } = await requireVisibleChurchWebsite(slug, "sermons");
  const item = await getPublishedSermonForChurch(
    decodeURIComponent(id),
    model.church.id,
    model.church.organizationId
  );
  if (!item) notFound();
  return <pages.SermonDetail model={model} item={item} />;
}
