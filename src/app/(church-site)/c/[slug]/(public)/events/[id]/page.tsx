import { notFound } from "next/navigation";

import AppEventDetailPage from "@/app/(root)/events/[id]/page";
import { getPublishedEventForChurch } from "@/lib/templates/public-content";
import { requireChurchWebsite } from "@/lib/templates/require-church-website";
import { usesSignatureAppExperience } from "@/lib/templates/signature-experience";
import { isSectionVisible } from "@/lib/templates/visibility";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const { model, pages } = await requireChurchWebsite(slug);
  if (usesSignatureAppExperience(model.templateId)) {
    return <AppEventDetailPage params={Promise.resolve({ id })} />;
  }
  if (!isSectionVisible(model.website.visibility, "events")) notFound();
  const item = await getPublishedEventForChurch(
    decodeURIComponent(id),
    model.church.id,
    model.church.organizationId
  );
  if (!item) notFound();
  return <pages.EventDetail model={model} item={item} />;
}
