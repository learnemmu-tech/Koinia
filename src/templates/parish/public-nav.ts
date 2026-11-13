import { churchWebsitePath } from "@/lib/templates/paths";
import type {
  ChurchWebsiteViewModel,
  WebsiteVisibilityKey,
} from "@/lib/templates/types";
import { isSectionVisible } from "@/lib/templates/visibility";

const NAV_KEYS = {
  Home: "home",
  About: "about",
  Sermons: "sermons",
  Give: "give",
  Contact: "contact",
  Contacts: "contact",
  Resources: "resources",
  Songs: "songs",
  Articles: "articles",
  Videos: "videos",
  Books: "books",
  Events: "events",
  Prayer: "prayer",
  "Prayer Requests": "prayerRequests",
  Community: "community",
  Chat: "chat",
  "Shepherd AI": "shepherd",
  Ministries: "ministries",
  "Worship Songs": "songs",
  Shorts: "videos",
} as const;

export type ParishNavMessageKey = (typeof NAV_KEYS)[keyof typeof NAV_KEYS];

export function parishNavMessageKey(label: string): ParishNavMessageKey | null {
  if (label in NAV_KEYS) return NAV_KEYS[label as keyof typeof NAV_KEYS];
  return null;
}

export type ParishNavLink = { href: string; label: string };
export type ParishNavGroup = { id: string; label: string; items: ParishNavLink[] };

type GatedLink = ParishNavLink & { section?: WebsiteVisibilityKey };

function visibleLinks(model: ChurchWebsiteViewModel, links: GatedLink[]): ParishNavLink[] {
  return links
    .filter((link) => !link.section || isSectionVisible(model.website.visibility, link.section))
    .map(({ href, label }) => ({ href, label }));
}

export function getParishPrimaryNavLinks(model: ChurchWebsiteViewModel): ParishNavLink[] {
  const slug = model.church.slug;
  return visibleLinks(model, [
    { href: churchWebsitePath(slug), label: "Home" },
    { href: churchWebsitePath(slug, "/sermons"), label: "Sermons", section: "sermons" },
    { href: churchWebsitePath(slug, "/events"), label: "Events" },
    { href: churchWebsitePath(slug, "/contact"), label: "Contact", section: "contact" },
  ]);
}

export function getParishPageLinks(model: ChurchWebsiteViewModel): ParishNavLink[] {
  const slug = model.church.slug;
  return visibleLinks(model, [
    { href: churchWebsitePath(slug, "/songs"), label: "Worship Songs" },
    { href: churchWebsitePath(slug, "/articles"), label: "Articles", section: "articles" },
    { href: churchWebsitePath(slug, "/books"), label: "Books" },
    { href: churchWebsitePath(slug, "/videos"), label: "Videos", section: "videos" },
    { href: churchWebsitePath(slug, "/prayer"), label: "Prayer Requests" },
    { href: churchWebsitePath(slug, "/community"), label: "Community" },
    { href: churchWebsitePath(slug, "/shepherd"), label: "Shepherd AI" },
  ]);
}

export function getParishPublicNavGroups(model: ChurchWebsiteViewModel): ParishNavGroup[] {
  const slug = model.church.slug;
  const member = model.viewer.isMember;
  const items = visibleLinks(model, [
    { href: churchWebsitePath(slug, "/songs"), label: "Songs" },
    { href: churchWebsitePath(slug, "/articles"), label: "Articles", section: "articles" },
    { href: churchWebsitePath(slug, "/videos"), label: "Videos", section: "videos" },
    { href: churchWebsitePath(slug, "/books"), label: "Books" },
    { href: churchWebsitePath(slug, "/prayer"), label: member ? "Prayer Requests" : "Prayer" },
    { href: churchWebsitePath(slug, "/community"), label: member ? "Chat" : "Community" },
    { href: churchWebsitePath(slug, "/shepherd"), label: "Shepherd AI" },
  ]);
  return items.length ? [{ id: "parish", label: "Parish", items }] : [];
}
