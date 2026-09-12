import type { AppNavItem, SidebarNavSection } from "@/config/app-sidebar-nav";

export type NavSearchResult = {
  resultId: string;
  href: string;
  title: string;
  subtitle?: string;
  icon?: AppNavItem["icon"];
};

export type NavVisibilityOptions = {
  isSuperAdmin: boolean;
  isAuthenticated: boolean;
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/** Same visibility rules as sidebar item rendering. */
export function isNavItemVisibleToViewer(
  item: AppNavItem,
  options: NavVisibilityOptions
): boolean {
  if (item.superAdminOnly && !options.isSuperAdmin) return false;
  if (item.authOnly && !options.isAuthenticated) return false;
  return true;
}

export function filterVisibleNavItems(
  items: AppNavItem[],
  options: NavVisibilityOptions
): AppNavItem[] {
  return items.filter((item) => isNavItemVisibleToViewer(item, options));
}

/** Score destination matches — higher is better. Exact label wins. */
function scoreNavItem(item: AppNavItem, query: string): number {
  const q = normalize(query);
  // Require 2+ chars so single letters do not dump every "s"-containing page.
  if (q.length < 2) return 0;

  const label = normalize(item.label);
  if (label === q) return 100;
  if (label.startsWith(q)) return 90;

  const labelWords = label.split(/\s+/);
  if (labelWords.some((word) => word.startsWith(q))) return 82;
  if (label.includes(q)) return 70;

  const keywords = item.searchKeywords ?? [];
  for (const keyword of keywords) {
    const k = normalize(keyword);
    if (k === q) return 88;
    if (k.startsWith(q)) return 78;
    const keywordWords = k.split(/\s+/);
    if (keywordWords.some((word) => word.startsWith(q))) return 72;
    // Avoid weak substring hits for very short queries (e.g. "so" inside "organization").
    if (q.length >= 3 && k.includes(q)) return 55;
  }

  return 0;
}

export function flattenSidebarNavItems(
  sections: SidebarNavSection[]
): AppNavItem[] {
  const seen = new Set<string>();
  const items: AppNavItem[] = [];

  for (const section of sections) {
    for (const item of section.items) {
      if (seen.has(item.href)) continue;
      seen.add(item.href);
      items.push(item);
    }
  }

  return items;
}

export function flattenVisibleSidebarNavItems(
  sections: SidebarNavSection[],
  options: NavVisibilityOptions
): AppNavItem[] {
  return filterVisibleNavItems(flattenSidebarNavItems(sections), options);
}

export function filterNavDestinations(
  items: AppNavItem[],
  query: string,
  limit = 6
): NavSearchResult[] {
  const q = normalize(query);
  if (q.length < 2) return [];

  return items
    .map((item) => ({ item, score: scoreNavItem(item, q) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label))
    .slice(0, limit)
    .map(({ item }) => ({
      resultId: `nav-${item.href}`,
      href: item.href,
      title: item.label,
      subtitle: "Go to page",
      icon: item.icon,
    }));
}
