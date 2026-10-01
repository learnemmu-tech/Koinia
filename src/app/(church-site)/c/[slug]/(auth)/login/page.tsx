import { redirect } from "next/navigation";

import { sanitizeCallbackUrl } from "@/lib/callback-url";
import { loadChurchWebsiteBySlug } from "@/lib/templates/load-church-website";
import { churchWebsitePath } from "@/lib/templates/paths";
import { HeritageLoginPage } from "@/templates/heritage/pages/login";

export const dynamic = "force-dynamic";

export default async function ChurchLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { slug } = await params;
  const { callbackUrl } = await searchParams;
  const model = await loadChurchWebsiteBySlug(slug);
  const fallback = churchWebsitePath(slug);
  const redirectTo = sanitizeCallbackUrl(callbackUrl, fallback);

  if (!model) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(redirectTo)}`);
  }

  if (model.viewer.isMember) redirect(churchWebsitePath(model.church.slug));

  if (model.templateId !== "heritage") {
    redirect(`/signin?callbackUrl=${encodeURIComponent(redirectTo)}`);
  }

  return <HeritageLoginPage model={model} callbackUrl={redirectTo} />;
}
