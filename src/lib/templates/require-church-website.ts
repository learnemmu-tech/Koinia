import "server-only";

import { notFound } from "next/navigation";

import { loadChurchWebsiteBySlug } from "@/lib/templates/load-church-website";
import { getTemplatePages } from "@/lib/templates/pages";
import type { ChurchWebsiteViewModel, TemplatePages } from "@/lib/templates/types";
import type { WebsiteVisibilityKey } from "@/lib/templates/types";
import { isSectionVisible } from "@/lib/templates/visibility";

export async function requireChurchWebsite(slug: string): Promise<{
  model: ChurchWebsiteViewModel;
  pages: TemplatePages;
}> {
  const model = await loadChurchWebsiteBySlug(slug);
  if (!model) notFound();
  return { model, pages: getTemplatePages(model.templateId) };
}

export async function requireVisibleChurchWebsite(
  slug: string,
  key: WebsiteVisibilityKey
) {
  const result = await requireChurchWebsite(slug);
  if (!isSectionVisible(result.model.website.visibility, key)) notFound();
  return result;
}
