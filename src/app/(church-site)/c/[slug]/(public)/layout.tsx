import { notFound } from "next/navigation";

import { loadChurchWebsiteBySlug } from "@/lib/templates/load-church-website";
import { getTemplatePages } from "@/lib/templates/pages";

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

  const pages = getTemplatePages(model.templateId);
  return <pages.Shell model={model}>{children}</pages.Shell>;
}
