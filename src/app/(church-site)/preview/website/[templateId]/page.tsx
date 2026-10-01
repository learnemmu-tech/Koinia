import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import { getDemoChurchWebsite } from "@/lib/templates/demo-content";
import { loadChurchWebsiteBySlug } from "@/lib/templates/load-church-website";
import { getTemplatePages } from "@/lib/templates/pages";
import { parseTemplateId } from "@/lib/templates/registry";
import { heritageDisplay, heritageSans } from "@/templates/heritage/fonts";
import { userCanManageChurch } from "@/lib/postgres/session";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = {
  robots: { index: false, follow: false },
  title: "Website preview",
};

export default async function WebsitePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<{ mode?: string; slug?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/signin?callbackUrl=/dashboard/website");
  }

  const { templateId: rawId } = await params;
  const { mode, slug } = await searchParams;
  const templateId = parseTemplateId(rawId);
  const previewMode = mode === "live" ? "live" : "demo";

  const model =
    previewMode === "live" && slug
      ? await loadChurchWebsiteBySlug(slug, { templateOverride: templateId })
      : getDemoChurchWebsite(templateId);

  if (!model) notFound();

  if (previewMode === "live") {
    const allowed = await userCanManageChurch(userId, undefined, model.church.id);
    if (!allowed) notFound();
  }

  const pages = getTemplatePages(templateId);
  const fontClass =
    templateId === "heritage"
      ? cn(heritageDisplay.variable, heritageSans.variable)
      : undefined;

  return (
    <div className={fontClass}>
      <pages.Shell model={{ ...model, templateId }}>
        <pages.Home model={{ ...model, templateId }} />
      </pages.Shell>
    </div>
  );
}
