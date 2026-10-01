import { requireVisibleChurchWebsite } from "@/lib/templates/require-church-website";

export const dynamic = "force-dynamic";

export default async function GivePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { model, pages } = await requireVisibleChurchWebsite(slug, "giving");
  return <pages.Give model={model} />;
}
