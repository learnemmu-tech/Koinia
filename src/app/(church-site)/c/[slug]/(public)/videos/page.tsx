import AppVideosPage from "@/app/(root)/videos/page";
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
  return generateChurchWebsiteMetadata(slug, "Videos");
}

export default async function VideosPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string; short?: string }>;
}) {
  const { slug } = await params;
  const { model, pages } = await requireChurchWebsite(slug);
  if (usesSignatureAppExperience(model.templateId)) {
    return <AppVideosPage searchParams={searchParams} />;
  }
  if (!isSectionVisible(model.website.visibility, "videos")) notFound();
  return <pages.Videos model={model} />;
}
