import AppSermonsPage from "@/app/(root)/sermons/page";
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
  return generateChurchWebsiteMetadata(slug, "Sermons");
}

export default async function SermonsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { model, pages } = await requireChurchWebsite(slug);
  if (usesSignatureAppExperience(model.templateId)) return <AppSermonsPage />;
  if (!isSectionVisible(model.website.visibility, "sermons")) notFound();
  return <pages.Sermons model={model} />;
}
