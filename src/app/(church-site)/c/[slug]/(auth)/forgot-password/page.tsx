import { redirect } from "next/navigation";

import { sanitizeCallbackUrl } from "@/lib/callback-url";
import { loadChurchWebsiteBySlug } from "@/lib/templates/load-church-website";
import { churchWebsitePath } from "@/lib/templates/paths";
import { HeritageForgotPasswordPage } from "@/templates/heritage/pages/forgot-password";

export const dynamic = "force-dynamic";

export default async function ChurchForgotPasswordPage({
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
    redirect(`/forgot-password?callbackUrl=${encodeURIComponent(redirectTo)}`);
  }

  if (model.viewer.isMember) redirect(churchWebsitePath(model.church.slug));

  if (model.templateId !== "heritage") {
    redirect(`/forgot-password?callbackUrl=${encodeURIComponent(redirectTo)}`);
  }

  return (
    <HeritageForgotPasswordPage model={model} callbackUrl={redirectTo} />
  );
}
