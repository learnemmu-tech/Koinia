import AppBooksPage from "@/app/(root)/books/page";
import { generateChurchWebsiteMetadata } from "@/lib/templates/church-page-metadata";
import { usesSignatureAppExperience } from "@/lib/templates/signature-experience";
import { requireChurchWebsite } from "@/lib/templates/require-church-website";
import { listPublishedCatalogBooks } from "@/lib/postgres/books";
import { HeritageBooksPage } from "@/templates/heritage/pages/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return generateChurchWebsiteMetadata(slug, "Books");
}

export default async function ChurchBooksPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { model } = await requireChurchWebsite(slug);
  if (usesSignatureAppExperience(model.templateId)) return <AppBooksPage />;

  const books = await listPublishedCatalogBooks({
    churchId: model.church.id,
    includeMembersOnlyForChurchIds: model.viewer.isMember
      ? [model.church.id]
      : undefined,
  });

  return <HeritageBooksPage model={model} books={books} />;
}
