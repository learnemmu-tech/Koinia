import { notFound } from "next/navigation";

import { generateChurchWebsiteMetadata } from "@/lib/templates/church-page-metadata";
import { requireChurchWebsite } from "@/lib/templates/require-church-website";
import { HeritagePrayerDetailPage } from "@/templates/heritage/pages/member-prayer";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug } = await params;
  return generateChurchWebsiteMetadata(slug, "Prayer request");
}

export default async function ChurchPrayerDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const { model } = await requireChurchWebsite(slug);

  // Church-scoped prayer detail exists only for the Heritage member experience.
  if (model.templateId !== "heritage") notFound();

  return <HeritagePrayerDetailPage model={model} requestId={decodeURIComponent(id)} />;
}
