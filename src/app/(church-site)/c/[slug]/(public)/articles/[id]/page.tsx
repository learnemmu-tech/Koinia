import { notFound } from "next/navigation";

import { getPublishedArticleForChurch } from "@/lib/templates/public-content";
import { requireVisibleChurchWebsite } from "@/lib/templates/require-church-website";

export const dynamic = "force-dynamic";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const { model, pages } = await requireVisibleChurchWebsite(slug, "articles");
  const item = await getPublishedArticleForChurch(
    decodeURIComponent(id),
    model.church.id,
    model.church.organizationId
  );
  if (!item) notFound();
  return <pages.ArticleDetail model={model} item={item} />;
}
