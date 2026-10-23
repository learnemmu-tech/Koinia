import AppAboutPage from "@/app/(root)/about/page";
import { requireChurchWebsite } from "@/lib/templates/require-church-website";
import { usesSignatureAppExperience } from "@/lib/templates/signature-experience";
import { isSectionVisible } from "@/lib/templates/visibility";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { model, pages } = await requireChurchWebsite(slug);
  if (usesSignatureAppExperience(model.templateId)) return <AppAboutPage />;
  if (!isSectionVisible(model.website.visibility, "about")) notFound();
  return <pages.About model={model} />;
}
