import { notFound } from "next/navigation";

import { loadChurchWebsiteBySlug } from "@/lib/templates/load-church-website";
import { getTemplatePages } from "@/lib/templates/pages";
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
  const model = await loadChurchWebsiteBySlug(slug);
  if (!model) notFound();

  if (usesSignatureAppExperience(model.templateId)) {
    return (
      <SignatureExperienceShell
        churchId={model.church.id}
        organizationId={model.church.organizationId}
        churchName={model.church.name}
        churchSlug={model.church.slug}
        logoUrl={model.website.images.logo || model.church.logoUrl}
      >
        {children}
      </SignatureExperienceShell>
    );
  }

  const pages = getTemplatePages(model.templateId);
  return <pages.Shell model={model}>{children}</pages.Shell>;
}
