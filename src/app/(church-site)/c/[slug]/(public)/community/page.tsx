import { generateChurchWebsiteMetadata } from "@/lib/templates/church-page-metadata";
import { requireChurchWebsite } from "@/lib/templates/require-church-website";
import { HeritageCommunityPage } from "@/templates/heritage/pages/catalog";
import { HeritageMemberChatPage } from "@/templates/heritage/pages/member-features";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return generateChurchWebsiteMetadata(slug, "Community");
}

export default async function CommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const { model, pages } = await requireChurchWebsite(slug);
  if (model.templateId === "heritage") {
    if (model.viewer.isMember) {
      return <HeritageMemberChatPage model={model} tab={tab} />;
    }
    return <HeritageCommunityPage model={model} />;
  }
  return <pages.MemberGate model={model} featureLabel="Community" />;
}
