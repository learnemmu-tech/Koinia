import { notFound } from "next/navigation";
import { headers } from "next/headers";

import { loadChurchWebsiteBySlug } from "@/lib/templates/load-church-website";
import {
  SignatureExperienceShell,
  usesSignatureAppExperience,
} from "@/lib/templates/signature-experience";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function ChurchPublicLayout({
  children,
  params,
}: LayoutProps) {
  const { slug } = await params;
  const headerStore = await headers();
  const model = await loadChurchWebsiteBySlug(slug, { includeContent: false });
  if (!model) notFound();

  if (usesSignatureAppExperience(model.templateId)) {
    return (
      <SignatureExperienceShell
        churchId={model.church.id}
        organizationId={model.church.organizationId}
        churchName={model.church.name}
        churchSlug={model.church.slug}
        logoUrl={model.website.images.logo || model.church.logoUrl}
        publicVisitor={headerStore.get("x-koinia-session") !== "1"}
      >
        {children}
      </SignatureExperienceShell>
    );
  }

  const { getTemplatePages } = await import("@/lib/templates/pages");
  const pages = getTemplatePages(model.templateId);
  return <pages.Shell model={model}>{children}</pages.Shell>;
}
