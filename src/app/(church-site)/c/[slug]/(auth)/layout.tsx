import { notFound } from "next/navigation";

import { loadChurchWebsiteBySlug } from "@/lib/templates/load-church-website";
import { HeritageAuthShell } from "@/templates/heritage/components/heritage-auth-shell";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function ChurchAuthLayout({
  children,
  params,
}: LayoutProps) {
  const { slug } = await params;
  const model = await loadChurchWebsiteBySlug(slug);
  if (!model) notFound();

  if (model.templateId !== "heritage") {
    return children;
  }

  return <HeritageAuthShell model={model}>{children}</HeritageAuthShell>;
}
