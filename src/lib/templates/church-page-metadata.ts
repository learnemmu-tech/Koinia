import type { Metadata } from "next";

import { loadChurchWebsiteBySlug } from "@/lib/templates/load-church-website";
import { churchWebsitePath } from "@/lib/templates/paths";
import { absoluteUrl } from "@/lib/utils";

export async function generateChurchWebsiteMetadata(
  slug: string,
  pageTitle?: string
): Promise<Metadata> {
  const model = await loadChurchWebsiteBySlug(slug);
  if (!model) return { title: "Church not found" };

  const churchName = model.church.name;
  const title = pageTitle
    ? { absolute: `${pageTitle} · ${churchName}` }
    : { absolute: model.website.siteTitle || churchName };
  const description = model.website.metaDescription;
  const image =
    model.website.images.socialPreview || model.website.ogImageUrl;
  const canonical =
    model.website.canonicalUrl ||
    absoluteUrl(churchWebsitePath(model.church.slug));

  return {
    title,
    description,
    alternates: { canonical },
    robots: model.website.indexable ? undefined : { index: false, follow: false },
    openGraph: {
      title: pageTitle ? `${pageTitle} · ${churchName}` : title.absolute,
      description,
      url: canonical,
      images: image ? [{ url: image, alt: churchName }] : undefined,
    },
  };
}
