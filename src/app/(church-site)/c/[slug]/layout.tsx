import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";

import { loadChurchWebsiteBySlug } from "@/lib/templates/load-church-website";
import { churchCanonicalPath } from "@/lib/templates/paths";
import { cn } from "@/lib/utils";
import { heritageDisplay, heritageSans } from "@/templates/heritage/fonts";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const model = await loadChurchWebsiteBySlug(slug);
  if (!model) return { title: "Church not found" };

  const title = model.website.siteTitle || model.church.name;
  const description = model.website.metaDescription;
  const image =
    model.website.images.socialPreview || model.website.ogImageUrl;
  const canonical = churchCanonicalPath(
    model.church.slug,
    model.website.canonicalUrl
  );
  const icons = model.website.images.favicon
    ? { icon: model.website.images.favicon }
    : undefined;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    robots: model.website.indexable ? undefined : { index: false, follow: false },
    openGraph: {
      title,
      description,
      url: canonical,
      images: image ? [{ url: image, alt: title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
    icons,
  };
}

export const viewport: Viewport = {
  themeColor: "#F5F1E8",
};

export default async function ChurchWebsiteLayout({
  children,
  params,
}: LayoutProps) {
  const { slug } = await params;
  const model = await loadChurchWebsiteBySlug(slug);
  if (!model) notFound();

  const fontClass =
    model.templateId === "heritage"
      ? cn(heritageDisplay.variable, heritageSans.variable)
      : undefined;

  return <div className={fontClass}>{children}</div>;
}
