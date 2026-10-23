import AppPrayerPage from "@/app/(root)/prayer-requests/page";
import { generateChurchWebsiteMetadata } from "@/lib/templates/church-page-metadata";
import { usesSignatureAppExperience } from "@/lib/templates/signature-experience";
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
  if (usesSignatureAppExperience(model.templateId)) return <AppPrayerPage />;

  // Heritage members stay inside the church website and see this church's
  // prayer wall. Visitors and non-members keep the public request form.
  if (model.templateId === "heritage" && (await shouldShowHeritageMemberPrayer(model))) {
    return <HeritageMemberPrayerPage model={model} />;
  }
  return <pages.Prayer model={model} />;
}
