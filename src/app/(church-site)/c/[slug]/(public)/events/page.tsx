import AppEventsPage from "@/app/(root)/events/page";
import { generateChurchWebsiteMetadata } from "@/lib/templates/church-page-metadata";
import { requireChurchWebsite } from "@/lib/templates/require-church-website";
import { isSectionVisible } from "@/lib/templates/visibility";
import { notFound } from "next/navigation";
import { usesSignatureAppExperience } from "@/lib/templates/signature-experience";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return generateChurchWebsiteMetadata(slug, "Events");
}

export default async function EventsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { model, pages } = await requireChurchWebsite(slug);
  if (usesSignatureAppExperience(model.templateId)) return <AppEventsPage />;
  if (!isSectionVisible(model.website.visibility, "events")) notFound();
  return <pages.Events model={model} />;
}
