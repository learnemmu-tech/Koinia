import { generateChurchWebsiteMetadata } from "@/lib/templates/church-page-metadata";
import { requireChurchWebsite } from "@/lib/templates/require-church-website";
import {
  HeritageMemberPrayerPage,
  shouldShowHeritageMemberPrayer,
} from "@/templates/heritage/pages/member-prayer";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return generateChurchWebsiteMetadata(slug, "Prayer");
}

export default async function PrayerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { model, pages } = await requireChurchWebsite(slug);

  // Heritage members stay inside the church website and see this church's
  // prayer wall. Visitors and non-members keep the public request form.
  if (model.templateId === "heritage" && (await shouldShowHeritageMemberPrayer(model))) {
    return <HeritageMemberPrayerPage model={model} />;
  }
  return <pages.Prayer model={model} />;
}
