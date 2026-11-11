import AppEventsPage from "@/app/(root)/events/page";
import { generateChurchWebsiteMetadata } from "@/lib/templates/church-page-metadata";
import { requireChurchWebsite } from "@/lib/templates/require-church-website";
import { isSectionVisible } from "@/lib/templates/visibility";
import { notFound } from "next/navigation";
import { usesSignatureAppExperience } from "@/lib/templates/signature-experience";

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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { model, pages } = await requireChurchWebsite(slug);
  if (usesSignatureAppExperience(model.templateId)) {
    return <AppEventsPage searchParams={searchParams} />;
  }
  if (!isSectionVisible(model.website.visibility, "events")) notFound();
  return <pages.Events model={model} />;
}
