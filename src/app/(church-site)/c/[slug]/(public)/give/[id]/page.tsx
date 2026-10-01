import { notFound } from "next/navigation";

import { getActiveCampaignForChurch } from "@/lib/templates/public-content";
import { requireVisibleChurchWebsite } from "@/lib/templates/require-church-website";

export const dynamic = "force-dynamic";

export default async function GiveDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const { model, pages } = await requireVisibleChurchWebsite(slug, "giving");
  const item = await getActiveCampaignForChurch(
    decodeURIComponent(id),
    model.church.id,
    model.church.organizationId
  );
  if (!item) notFound();
  return <pages.GiveDetail model={model} item={item} />;
}
