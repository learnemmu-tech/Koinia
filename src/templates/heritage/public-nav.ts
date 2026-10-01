import { churchWebsitePath } from "@/lib/templates/paths";
import type {
  ChurchWebsiteViewModel,
  WebsiteVisibilityKey,
} from "@/lib/templates/types";
import { isSectionVisible } from "@/lib/templates/visibility";

export type HeritagePublicNavLink = {
  href: string;
  label: string;
};

export type HeritagePublicNavGroup = {
  id: string;
  label: string;
  items: HeritagePublicNavLink[];
};

type GatedLink = HeritagePublicNavLink & { section?: WebsiteVisibilityKey };

function visibleLinks(
  model: ChurchWebsiteViewModel,
  links: GatedLink[]
): HeritagePublicNavLink[] {
  return links
    .filter(
      (link) =>
        !link.section || isSectionVisible(model.website.visibility, link.section)
    )
    .map(({ href, label }) => ({ href, label }));
}

/**
 * Top-level header links: Home, About, Sermons, Give, Contact.
 * Every href stays inside `/c/{slug}`.
 */
export function getHeritagePrimaryNavLinks(
  model: ChurchWebsiteViewModel
): HeritagePublicNavLink[] {
  const slug = model.church.slug;
  return visibleLinks(model, [
    { href: churchWebsitePath(slug), label: "Home" },
    { href: churchWebsitePath(slug, "/about"), label: "About", section: "about" },
    {
      href: churchWebsitePath(slug, "/sermons"),
      label: "Sermons",
      section: "sermons",
    },
    {
      href: churchWebsitePath(slug, "/give"),
      label: "Give",
      section: "giving",
    },
    {
      href: churchWebsitePath(slug, "/contact"),
      label: "Contact",
      section: "contact",
    },
  ]);
}

/**
 * Remaining church features live under Resources so the header stays close to
 * the reference while every enabled destination remains reachable.
 */
export function getHeritagePublicNavGroups(
  model: ChurchWebsiteViewModel
): HeritagePublicNavGroup[] {
  const slug = model.church.slug;
  const member = model.viewer.isMember;
  const items = visibleLinks(model, [
    { href: churchWebsitePath(slug, "/songs"), label: "Songs" },
    {
      href: churchWebsitePath(slug, "/articles"),
      label: "Articles",
      section: "articles",
    },
    {
      href: churchWebsitePath(slug, "/videos"),
      label: "Videos",
      section: "videos",
    },
    { href: churchWebsitePath(slug, "/books"), label: "Books" },
    {
      href: churchWebsitePath(slug, "/events"),
      label: "Events",
      section: "events",
    },
    {
      href: churchWebsitePath(slug, "/prayer"),
      label: member ? "Prayer Requests" : "Prayer",
    },
    {
      href: churchWebsitePath(slug, "/community"),
      label: member ? "Chat" : "Community",
    },
    { href: churchWebsitePath(slug, "/shepherd"), label: "Shepherd AI" },
  ]);

  return items.length ? [{ id: "resources", label: "Resources", items }] : [];
}

/** Compact footer row from the reference: primary pages plus Resources. */
export function getHeritageFooterNavLinks(
  model: ChurchWebsiteViewModel
): HeritagePublicNavLink[] {
  const primary = getHeritagePrimaryNavLinks(model);
  const resources = getHeritagePublicNavGroups(model)[0];
  const resourcesHref =
    resources?.items.find((item) => item.href.endsWith("/books"))?.href ??
    resources?.items[0]?.href;
  const links = [...primary];
  if (resourcesHref && !links.some((item) => item.href === resourcesHref)) {
    const contactIndex = links.findIndex((item) => item.label === "Contact");
    const entry = { href: resourcesHref, label: "Resources" };
    if (contactIndex >= 0) links.splice(contactIndex, 0, entry);
    else links.push(entry);
  }
  return links;
}

/** Header no longer uses a separate utility row; Give is a primary link. */
export function getHeritageUtilityLinks(
  _model: ChurchWebsiteViewModel
): HeritagePublicNavLink[] {
  return [];
}
