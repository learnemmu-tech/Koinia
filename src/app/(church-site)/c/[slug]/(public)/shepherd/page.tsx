import AppShepherdPage from "@/app/(root)/shepherd/page";
import { generateChurchWebsiteMetadata } from "@/lib/templates/church-page-metadata";
import { usesSignatureAppExperience } from "@/lib/templates/signature-experience";
import { requireChurchWebsite } from "@/lib/templates/require-church-website";
import { HeritageShepherdPage } from "@/templates/heritage/pages/catalog";
import { HeritageMemberShepherdPage } from "@/templates/heritage/pages/member-features";
import { ParishShepherdPage } from "@/templates/parish/pages/catalog";

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
  if (usesSignatureAppExperience(model.templateId)) return <AppShepherdPage />;
  if (model.templateId === "heritage" || model.templateId === "parish") {
    if (model.viewer.isMember) {
      return <HeritageMemberShepherdPage model={model} />;
    }
    return model.templateId === "parish" ? (
      <ParishShepherdPage model={model} />
    ) : (
      <HeritageShepherdPage model={model} />
    );
  }
  return <pages.MemberGate model={model} featureLabel="Shepherd AI" />;
}
