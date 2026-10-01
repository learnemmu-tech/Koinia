import { redirect } from "next/navigation";

import { joinPathForSlug } from "@/lib/auth/auth-paths";
import { sanitizeCallbackUrl } from "@/lib/callback-url";
import { loadChurchWebsiteBySlug } from "@/lib/templates/load-church-website";
import { churchWebsitePath } from "@/lib/templates/paths";
import { HeritageSignupPage } from "@/templates/heritage/pages/signup";

export const dynamic = "force-dynamic";

export default async function ChurchSignupPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { slug } = await params;
  const { callbackUrl } = await searchParams;
  const model = await loadChurchWebsiteBySlug(slug);
  const joinFallback = joinPathForSlug(slug);
  const redirectTo = sanitizeCallbackUrl(callbackUrl, joinFallback);

  if (!model) {
    redirect(`/signup?callbackUrl=${encodeURIComponent(redirectTo)}`);
  }

  if (model.viewer.isMember) redirect(churchWebsitePath(model.church.slug));

  if (model.templateId !== "heritage") {
    redirect(`/signup?callbackUrl=${encodeURIComponent(redirectTo)}`);
  }

  return <HeritageSignupPage model={model} callbackUrl={redirectTo} />;
}
