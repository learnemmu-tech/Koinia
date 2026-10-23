import { notFound } from "next/navigation";

import AppSermonDetailPage from "@/app/(root)/sermons/[id]/page";
import { getPublishedSermonForChurch } from "@/lib/templates/public-content";
import { requireChurchWebsite } from "@/lib/templates/require-church-website";
import { usesSignatureAppExperience } from "@/lib/templates/signature-experience";
import { isSectionVisible } from "@/lib/templates/visibility";

export const dynamic = "force-dynamic";

export default async function SermonDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const { model, pages } = await requireChurchWebsite(slug);
  if (usesSignatureAppExperience(model.templateId)) {
    return <AppSermonDetailPage params={Promise.resolve({ id })} />;
  }
  if (!isSectionVisible(model.website.visibility, "sermons")) notFound();
  const item = await getPublishedSermonForChurch(
    decodeURIComponent(id),
    model.church.id,
    model.church.organizationId
  );
  if (!item) notFound();
  return <pages.SermonDetail model={model} item={item} />;
}
