import AppSongsPage from "@/app/(root)/songs/page";
import { tenantContentQuery } from "@/lib/content/content-scope";
import { usesSignatureAppExperience } from "@/lib/templates/signature-experience";
import { generateChurchWebsiteMetadata } from "@/lib/templates/church-page-metadata";
import { requireChurchWebsite } from "@/lib/templates/require-church-website";
import { listSongs } from "@/lib/postgres/features";
import { HeritageSongsPage } from "@/templates/heritage/pages/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return generateChurchWebsiteMetadata(slug, "Songs");
}

export default async function ChurchSongsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { model } = await requireChurchWebsite(slug);
  if (usesSignatureAppExperience(model.templateId)) return <AppSongsPage />;

  const songs = await listSongs(
    tenantContentQuery({
      organizationId: model.church.organizationId,
      churchId: model.church.id,
    }),
    { publishedOnly: true, limit: 80 }
  );

  return <HeritageSongsPage model={model} songs={songs} />;
}
