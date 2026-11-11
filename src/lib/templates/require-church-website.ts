import "server-only";

import { notFound } from "next/navigation";

import { loadChurchWebsiteBySlug } from "@/lib/templates/load-church-website";
import { usesSignatureAppExperience } from "@/lib/templates/signature-experience";
import type { ChurchWebsiteViewModel, TemplatePages } from "@/lib/templates/types";
import type { WebsiteVisibilityKey } from "@/lib/templates/types";
import { isSectionVisible } from "@/lib/templates/visibility";

export async function requireChurchWebsite(slug: string): Promise<{
  model: ChurchWebsiteViewModel;
  pages: TemplatePages;
}> {
  const shell = await loadChurchWebsiteBySlug(slug, { includeContent: false });
  if (!shell) notFound();
  // Signature pages render the existing app routes, which load their own
  // lists. Heritage pages render from this model, so they still need content.
  const model = usesSignatureAppExperience(shell.templateId)
    ? shell
    : await loadChurchWebsiteBySlug(slug);
  if (!model) notFound();
  if (usesSignatureAppExperience(model.templateId)) {
    return { model, pages: unusedSignatureTemplatePages };
  }
  const { getTemplatePages } = await import("@/lib/templates/pages");
  return { model, pages: getTemplatePages(model.templateId) };
}

/** Signature routes render the app pages and never read this object. */
const unusedSignatureTemplatePages = new Proxy({} as TemplatePages, {
  get() {
    throw new Error("Signature church routes do not render template pages.");
  },
});

export async function requireVisibleChurchWebsite(
  slug: string,
  key: WebsiteVisibilityKey
) {
  const result = await requireChurchWebsite(slug);
  if (!isSectionVisible(result.model.website.visibility, key)) notFound();
  return result;
}
