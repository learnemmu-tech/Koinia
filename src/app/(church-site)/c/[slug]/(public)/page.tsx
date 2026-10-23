import AppHomePage from "@/app/(root)/page";
import { loadChurchWebsiteBySlug } from "@/lib/templates/load-church-website";
import { getTemplatePages } from "@/lib/templates/pages";
import { usesSignatureAppExperience } from "@/lib/templates/signature-experience";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export default async function ChurchHomePage({ params }: PageProps) {
  const { slug } = await params;
  const model = await loadChurchWebsiteBySlug(slug);
  if (!model) notFound();
  if (usesSignatureAppExperience(model.templateId)) {
    return <AppHomePage />;
  }
  const pages = getTemplatePages(model.templateId);
  return <pages.Home model={model} />;
}
