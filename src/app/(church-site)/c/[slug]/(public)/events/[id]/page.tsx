import { notFound } from "next/navigation";

import { getPublishedEventForChurch } from "@/lib/templates/public-content";
import { requireVisibleChurchWebsite } from "@/lib/templates/require-church-website";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const { model, pages } = await requireVisibleChurchWebsite(slug, "events");
  const item = await getPublishedEventForChurch(
    decodeURIComponent(id),
    model.church.id,
    model.church.organizationId
  );
  if (!item) notFound();
  return <pages.EventDetail model={model} item={item} />;
}
