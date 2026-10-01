import { tenantContentQuery } from "@/lib/content/content-scope";
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
  const songs = await listSongs(
    tenantContentQuery({
      organizationId: model.church.organizationId,
      churchId: model.church.id,
    }),
    { publishedOnly: true, limit: 80 }
  );

  if (model.templateId === "heritage") {
    return <HeritageSongsPage model={model} songs={songs} />;
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="font-heading text-4xl">Songs</h1>
      <ul className="mt-8 space-y-3">
        {songs.map((song) => (
          <li key={song.id}>{song.songTitle || song.title}</li>
        ))}
      </ul>
    </section>
  );
}
