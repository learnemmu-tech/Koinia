import { generateChurchWebsiteMetadata } from "@/lib/templates/church-page-metadata";
import { requireChurchWebsite } from "@/lib/templates/require-church-website";
import { HeritageShepherdPage } from "@/templates/heritage/pages/catalog";
import { HeritageMemberShepherdPage } from "@/templates/heritage/pages/member-features";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return generateChurchWebsiteMetadata(slug, "Shepherd AI");
}

export default async function ChurchShepherdPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { model, pages } = await requireChurchWebsite(slug);
  if (model.templateId === "heritage") {
    if (model.viewer.isMember) {
      return <HeritageMemberShepherdPage model={model} />;
    }
    return <HeritageShepherdPage model={model} />;
  }
  return <pages.MemberGate model={model} featureLabel="Shepherd AI" />;
}
