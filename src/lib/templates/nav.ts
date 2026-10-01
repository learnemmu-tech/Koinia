import { churchWebsitePath } from "@/lib/templates/paths";
import type { ChurchWebsiteViewModel, TemplateNavItem } from "@/lib/templates/types";
import { isSectionVisible } from "@/lib/templates/visibility";

export function getPrimaryNavItems(
  model: ChurchWebsiteViewModel
): TemplateNavItem[] {
  const slug = model.church.slug;
  const items: TemplateNavItem[] = [
    { href: churchWebsitePath(slug), label: "Home" },
  ];

  if (isSectionVisible(model.website.visibility, "about")) {
    items.push({ href: churchWebsitePath(slug, "/about"), label: "About" });
  }
  if (isSectionVisible(model.website.visibility, "sermons")) {
    items.push({ href: churchWebsitePath(slug, "/sermons"), label: "Sermons" });
  }
  if (isSectionVisible(model.website.visibility, "events")) {
    items.push({ href: churchWebsitePath(slug, "/events"), label: "Events" });
  }
  if (isSectionVisible(model.website.visibility, "ministries")) {
    items.push({
      href: churchWebsitePath(slug, "/ministries"),
      label: "Ministries",
    });
  }
  if (isSectionVisible(model.website.visibility, "articles")) {
    items.push({ href: churchWebsitePath(slug, "/articles"), label: "Articles" });
  }
  if (isSectionVisible(model.website.visibility, "videos")) {
    items.push({ href: churchWebsitePath(slug, "/videos"), label: "Videos" });
  }
  items.push({ href: churchWebsitePath(slug, "/songs"), label: "Songs" });
  items.push({ href: churchWebsitePath(slug, "/books"), label: "Books" });

  return items;
}

export function getUtilityNavItems(
  model: ChurchWebsiteViewModel
): TemplateNavItem[] {
  const slug = model.church.slug;
  const items: TemplateNavItem[] = [];

  items.push({ href: churchWebsitePath(slug, "/prayer"), label: "Prayer" });
  if (isSectionVisible(model.website.visibility, "giving")) {
    items.push({ href: churchWebsitePath(slug, "/give"), label: "Give" });
  }
  if (isSectionVisible(model.website.visibility, "contact")) {
    items.push({ href: churchWebsitePath(slug, "/contact"), label: "Contact" });
  }

  return items;
}

export function getFooterNavItems(
  model: ChurchWebsiteViewModel
): TemplateNavItem[] {
  return [
    ...getPrimaryNavItems(model),
    ...getUtilityNavItems(model),
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
  ];
}
