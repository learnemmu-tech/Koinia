import { requireVisibleChurchWebsite } from "@/lib/templates/require-church-website";

export const dynamic = "force-dynamic";

export default async function MinistriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { model, pages } = await requireVisibleChurchWebsite(slug, "ministries");
  return <pages.Ministries model={model} />;
}
