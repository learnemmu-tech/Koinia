import { notFound } from "next/navigation";

import AppArticleDetailPage from "@/app/(root)/articles/[id]/page";
import { getPublishedArticleForChurch } from "@/lib/templates/public-content";
import { requireChurchWebsite } from "@/lib/templates/require-church-website";
import { usesSignatureAppExperience } from "@/lib/templates/signature-experience";
import { isSectionVisible } from "@/lib/templates/visibility";

export const dynamic = "force-dynamic";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const { model, pages } = await requireChurchWebsite(slug);
  if (usesSignatureAppExperience(model.templateId)) {
    return <AppArticleDetailPage params={Promise.resolve({ id })} />;
  }
  if (!isSectionVisible(model.website.visibility, "articles")) notFound();
  const item = await getPublishedArticleForChurch(
    decodeURIComponent(id),
    model.church.id,
    model.church.organizationId
  );
  if (!item) notFound();
  return <pages.ArticleDetail model={model} item={item} />;
}
