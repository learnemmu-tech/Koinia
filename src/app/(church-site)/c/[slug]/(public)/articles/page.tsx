import AppArticlesPage from "@/app/(root)/articles/page";
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
  return generateChurchWebsiteMetadata(slug, "Articles");
}

export default async function ArticlesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { model, pages } = await requireChurchWebsite(slug);
  if (usesSignatureAppExperience(model.templateId)) {
    return <AppArticlesPage searchParams={searchParams} />;
  }
  if (!isSectionVisible(model.website.visibility, "articles")) notFound();
  return <pages.Articles model={model} />;
}
