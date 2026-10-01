import { generateChurchWebsiteMetadata } from "@/lib/templates/church-page-metadata";
import { requireVisibleChurchWebsite } from "@/lib/templates/require-church-website";

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
  const { model, pages } = await requireVisibleChurchWebsite(slug, "events");
  return <pages.Events model={model} />;
}
