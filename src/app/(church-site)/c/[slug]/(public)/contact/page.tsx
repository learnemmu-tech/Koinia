import { requireVisibleChurchWebsite } from "@/lib/templates/require-church-website";

export const dynamic = "force-dynamic";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { model, pages } = await requireVisibleChurchWebsite(slug, "contact");
  return <pages.Contact model={model} />;
}
