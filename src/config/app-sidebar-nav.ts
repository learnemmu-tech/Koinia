import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookMarked,
  BookOpen,
  CalendarDays,
  Church,
  Clapperboard,
  CreditCard,
  FileText,
  HandHelping,
  Heart,
  Home,
  Layers,
  LayoutDashboard,
  Library,
  Music,
  Settings2,
  Shield,
  Users,
} from "lucide-react";

import { ShepherdIcon } from "@/components/shepherd/shepherd-icon";
import { SUPER_ADMIN_BASE } from "@/lib/auth/auth-paths";

import type { FirebaseChurch } from "@/types/firebase-church";
import type { FirebaseOrganization } from "@/types/organization";
import { isMultiChurchOrgWorkspace } from "@/lib/organization/workspace-type";

export type AppNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
  /** Optional badge count (admin sidebar). */
  badgeKey?: "pendingPrayers" | "pendingMembers" | "pendingContent";
  superAdminOnly?: boolean;
  authOnly?: boolean;
  /** Extra keywords for global destination search (not shown in UI). */
  searchKeywords?: string[];
};

export type SidebarNavSection = {
  label?: string;
  items: AppNavItem[];
  /** When false, section stays expanded (no accordion). Default: labeled sections collapse. */
  collapsible?: boolean;
};

/** @deprecated Use SidebarNavSection */
export type AppNavGroup = SidebarNavSection & {
  separated?: boolean;
};

const exact = (href: string) => (pathname: string) => pathname === href;
const startsWith = (href: string) => (pathname: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

const ADMIN_BASE = "/dashboard";

export const CHURCHES_NAV_ITEM: AppNavItem = {
  label: "Churches",
  href: `${ADMIN_BASE}/organization?tab=churches`,
  icon: Church,
  match: (pathname) =>
    pathname.startsWith(`${ADMIN_BASE}/organization`) ||
    pathname.startsWith(`${ADMIN_BASE}/churches`),
};

export const HOME_NAV_ITEM: AppNavItem = {
  label: "Home",
  href: "/",
  icon: Home,
  match: exact("/"),
  searchKeywords: ["home", "start"],
};

export const MANAGE_NAV_ITEMS: AppNavItem[] = [
  {
    label: "Dashboard",
    href: ADMIN_BASE,
    icon: LayoutDashboard,
    match: exact(ADMIN_BASE),
    searchKeywords: ["dashboard", "overview"],
  },
  {
    label: "Members",
    href: `${ADMIN_BASE}/members`,
    icon: Users,
    match: (pathname) =>
      pathname.startsWith(`${ADMIN_BASE}/members`) ||
      pathname.startsWith(`${ADMIN_BASE}/users`),
    badgeKey: "pendingMembers",
    searchKeywords: ["members", "users", "people"],
  },
  {
    label: "Analytics",
    href: `${ADMIN_BASE}/analytics`,
    icon: BarChart3,
    match: startsWith(`${ADMIN_BASE}/analytics`),
    searchKeywords: ["analytics", "stats", "reports"],
  },
  {
    label: "Content Management",
    href: `${ADMIN_BASE}/content`,
    icon: Layers,
    match: startsWith(`${ADMIN_BASE}/content`),
    badgeKey: "pendingContent",
    searchKeywords: ["content", "management", "cms", "admin content"],
  },
];

/** Browseable ministry content destinations. */
export const CONTENT_NAV_ITEMS: AppNavItem[] = [
  {
    label: "Songs",
    href: "/songs",
    icon: Music,
    match: startsWith("/songs"),
    searchKeywords: ["songs", "music", "worship", "lyrics"],
  },
  {
    label: "Sermons",
    href: "/sermons",
    icon: BookOpen,
    match: startsWith("/sermons"),
    searchKeywords: ["sermons", "messages", "preaching"],
  },
  {
    label: "Articles",
    href: "/articles",
    icon: FileText,
    match: startsWith("/articles"),
    searchKeywords: ["articles", "posts", "blog"],
  },
  {
    label: "Shorts",
    href: "/shorts",
    icon: Clapperboard,
    match: startsWith("/shorts"),
    searchKeywords: ["shorts", "videos", "clips"],
  },
  {
    label: "Events",
    href: "/events",
    icon: CalendarDays,
    match: startsWith("/events"),
    searchKeywords: ["events", "calendar", "gatherings"],
  },
  {
    label: "Books",
    href: "/books",
    icon: BookMarked,
    match: startsWith("/books"),
    searchKeywords: ["books", "library catalog", "reading"],
  },
];

export const COMMUNITY_NAV_ITEMS: AppNavItem[] = [
  {
    label: "Donations",
    href: "/donations",
    icon: Heart,
    match: startsWith("/donations"),
    searchKeywords: ["donations", "giving", "tithe", "offerings"],
  },
  {
    label: "Prayer Requests",
    href: "/prayer-requests",
    icon: HandHelping,
    match: startsWith("/prayer-requests"),
    badgeKey: "pendingPrayers",
    searchKeywords: ["prayer", "prayers", "prayer requests", "pray"],
  },
  {
    label: "Library",
    href: "/favorites",
    icon: Library,
    match: startsWith("/favorites"),
    authOnly: true,
    searchKeywords: ["library", "favorites", "saved"],
  },
];

/** @deprecated Prefer CONTENT_NAV_ITEMS + COMMUNITY_NAV_ITEMS */
export const BROWSE_NAV_ITEMS: AppNavItem[] = [
  ...CONTENT_NAV_ITEMS.filter((item) => item.href !== "/books"),
  ...COMMUNITY_NAV_ITEMS.filter((item) => item.href !== "/favorites"),
];

/** Public FaithConnectHub showcase browse links — no tenant-only features. */
export const PUBLIC_BROWSE_NAV_ITEMS: AppNavItem[] = [
  ...CONTENT_NAV_ITEMS.filter((item) => item.href !== "/books"),
  ...COMMUNITY_NAV_ITEMS.filter((item) => item.href === "/donations"),
];

export const BOOKS_NAV_ITEM: AppNavItem =
  CONTENT_NAV_ITEMS.find((item) => item.href === "/books")!;

export const LIBRARY_NAV_ITEM: AppNavItem =
  COMMUNITY_NAV_ITEMS.find((item) => item.href === "/favorites")!;

export const RESOURCE_NAV_ITEMS: AppNavItem[] = [
  BOOKS_NAV_ITEM,
  LIBRARY_NAV_ITEM,
];

export const PUBLIC_RESOURCE_NAV_ITEMS: AppNavItem[] = [BOOKS_NAV_ITEM];

export const SUPER_ADMIN_NAV_ITEM: AppNavItem = {
  label: "Super Admin",
  href: SUPER_ADMIN_BASE,
  icon: Shield,
  match: startsWith(SUPER_ADMIN_BASE),
  superAdminOnly: true,
  searchKeywords: ["super admin", "platform"],
};

export const SHEPHERD_NAV_ITEM: AppNavItem = {
  label: "Shepherd AI",
  href: "/shepherd",
  icon: ShepherdIcon as LucideIcon,
  match: startsWith("/shepherd"),
  authOnly: true,
  searchKeywords: ["shepherd", "ai", "assistant", "bible help"],
};

export const ADMIN_FOOTER_NAV_ITEMS: AppNavItem[] = [
  {
    label: "Church Settings",
    href: `${ADMIN_BASE}/church-settings`,
    icon: Settings2,
    match: startsWith(`${ADMIN_BASE}/church-settings`),
    searchKeywords: ["church settings", "settings", "church"],
  },
  {
    label: "Billing",
    href: `${ADMIN_BASE}/billing`,
    icon: CreditCard,
    match: startsWith(`${ADMIN_BASE}/billing`),
    searchKeywords: ["billing", "subscription", "plan", "payment"],
  },
];

export const MULTI_ORG_MANAGE_NAV_ITEMS: AppNavItem[] = [
  {
    label: "Dashboard",
    href: ADMIN_BASE,
    icon: LayoutDashboard,
    match: exact(ADMIN_BASE),
    searchKeywords: ["dashboard", "overview"],
  },
  {
    label: "Organization Settings",
    href: `${ADMIN_BASE}/organization`,
    icon: Settings2,
    match: startsWith(`${ADMIN_BASE}/organization`),
    searchKeywords: ["organization", "org settings", "settings"],
  },
  {
    label: "Members",
    href: `${ADMIN_BASE}/members`,
    icon: Users,
    match: (pathname) =>
      pathname.startsWith(`${ADMIN_BASE}/members`) ||
      pathname.startsWith(`${ADMIN_BASE}/users`),
    badgeKey: "pendingMembers",
    searchKeywords: ["members", "users", "people"],
  },
  {
    label: "Analytics",
    href: `${ADMIN_BASE}/analytics`,
    icon: BarChart3,
    match: startsWith(`${ADMIN_BASE}/analytics`),
    searchKeywords: ["analytics", "stats", "reports"],
  },
];

export const MULTI_ORG_SETTINGS_NAV_ITEMS: AppNavItem[] = [
  {
    label: "Billing",
    href: `${ADMIN_BASE}/billing`,
    icon: CreditCard,
    match: startsWith(`${ADMIN_BASE}/billing`),
    searchKeywords: ["billing", "subscription", "plan", "payment"],
  },
];

export function buildChurchNavItems(churches: FirebaseChurch[]): AppNavItem[] {
  return churches.map((church) => ({
    label: church.name,
    href: `${ADMIN_BASE}?churchId=${encodeURIComponent(church.id)}`,
    icon: Church,
    match: (pathname) => pathname === ADMIN_BASE || pathname === `${ADMIN_BASE}/`,
  }));
}

export function getMultiOrgAdminSidebarSections(
  organization: FirebaseOrganization | null | undefined,
  churches: FirebaseChurch[] = []
): SidebarNavSection[] {
  const churchItems = buildChurchNavItems(churches);

  return [
    { items: [HOME_NAV_ITEM], collapsible: false },
    { label: "Manage", items: MULTI_ORG_MANAGE_NAV_ITEMS },
    { label: "Content", items: CONTENT_NAV_ITEMS },
    {
      label: "Community",
      items: COMMUNITY_NAV_ITEMS.map(({ badgeKey: _, ...item }) => item),
    },
    {
      label: "Churches",
      items: [
        ...churchItems,
        {
          label: "Add Church",
          href: `${ADMIN_BASE}?createChurch=1`,
          icon: Church,
          match: () => false,
          searchKeywords: ["add church", "new church"],
        },
      ],
    },
  ];
}

const ORGANIZATION_ADMIN_ONLY_HREFS = new Set([
  `${ADMIN_BASE}/billing`,
  `${ADMIN_BASE}/church-settings`,
  `${ADMIN_BASE}/organization`,
]);

export function filterSidebarSectionsForRole(
  sections: SidebarNavSection[],
  options: { canManageOrganization: boolean }
): SidebarNavSection[] {
  if (options.canManageOrganization) return sections;

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (ORGANIZATION_ADMIN_ONLY_HREFS.has(item.href)) return false;
        if (item.href.includes("createChurch=")) return false;
        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);
}

export function getAdminSidebarSections(
  organization?: FirebaseOrganization | null,
  churches: FirebaseChurch[] = []
): SidebarNavSection[] {
  if (isMultiChurchOrgWorkspace(organization)) {
    return [
      ...getMultiOrgAdminSidebarSections(organization, churches),
      { label: "Organization", items: MULTI_ORG_SETTINGS_NAV_ITEMS },
      { label: "Tools", items: [SHEPHERD_NAV_ITEM] },
    ];
  }

  return [
    { items: [HOME_NAV_ITEM], collapsible: false },
    { label: "Manage", items: [...MANAGE_NAV_ITEMS] },
    { label: "Content", items: CONTENT_NAV_ITEMS },
    { label: "Community", items: COMMUNITY_NAV_ITEMS },
    { label: "Organization", items: ADMIN_FOOTER_NAV_ITEMS },
    { label: "Tools", items: [SHEPHERD_NAV_ITEM] },
  ];
}

export function getPublicSidebarSections(): SidebarNavSection[] {
  return [
    { items: [HOME_NAV_ITEM], collapsible: false },
    { label: "Content", items: PUBLIC_BROWSE_NAV_ITEMS },
    { label: "Resources", items: PUBLIC_RESOURCE_NAV_ITEMS },
  ];
}

/**
 * Platform SuperAdmins have no tenant workspace, so they get no `/dashboard`
 * links. Platform showcase content is managed inline on the public browse pages
 * under the `platform_public` scope.
 */
export function getSuperAdminSidebarSections(): SidebarNavSection[] {
  return [
    { items: [HOME_NAV_ITEM], collapsible: false },
    { label: "Content", items: PUBLIC_BROWSE_NAV_ITEMS },
    { label: "Resources", items: PUBLIC_RESOURCE_NAV_ITEMS },
    { items: [SUPER_ADMIN_NAV_ITEM], collapsible: false },
  ];
}

export function getMemberSidebarSections(): SidebarNavSection[] {
  return [
    { items: [HOME_NAV_ITEM], collapsible: false },
    { label: "Content", items: CONTENT_NAV_ITEMS },
    {
      label: "Community",
      items: COMMUNITY_NAV_ITEMS.map(({ badgeKey: _, ...item }) => item),
    },
    { label: "Tools", items: [SHEPHERD_NAV_ITEM] },
  ];
}

/** @deprecated */
export const HOME_NAV_ITEMS = [HOME_NAV_ITEM];
export const WORKSPACE_NAV_ITEMS = MANAGE_NAV_ITEMS.filter(
  (item) => item.label !== "Content Management"
);
/** @deprecated Prefer CONTENT_NAV_ITEMS for browse content */
export const CONTENT_MANAGEMENT_NAV_ITEMS = MANAGE_NAV_ITEMS.filter(
  (item) => item.label === "Content Management"
);
export const SETTINGS_NAV_ITEMS = ADMIN_FOOTER_NAV_ITEMS;
export const MEMBER_PUBLIC_NAV_GROUP = {
  label: "Browse",
  items: [HOME_NAV_ITEM, ...BROWSE_NAV_ITEMS],
};
export const PUBLIC_NAV_GROUP = MEMBER_PUBLIC_NAV_GROUP;
export const ADMIN_PUBLIC_NAV_GROUP = { label: "Public", items: [HOME_NAV_ITEM] };
export const APP_NAV_GROUPS = [MEMBER_PUBLIC_NAV_GROUP];

export function getWorkspaceNavGroup() {
  return { label: "Manage", separated: true, items: WORKSPACE_NAV_ITEMS };
}
export function getContentNavGroup() {
  return { label: "Content", items: CONTENT_MANAGEMENT_NAV_ITEMS };
}
export function getSettingsNavGroup() {
  return { label: "Settings", items: SETTINGS_NAV_ITEMS };
}
export function getAdminSidebarGroups() {
  return getAdminSidebarSections();
}
export function getAdminNavGroup() {
  return getWorkspaceNavGroup();
}
export function getLibraryNavGroup() {
  return { label: "Library", items: [] as AppNavItem[] };
}

export function getAllAppNavItems(): AppNavItem[] {
  const seen = new Set<string>();
  const items: AppNavItem[] = [];

  for (const item of [
    HOME_NAV_ITEM,
    ...MANAGE_NAV_ITEMS,
    ...MULTI_ORG_MANAGE_NAV_ITEMS,
    ...CONTENT_NAV_ITEMS,
    ...COMMUNITY_NAV_ITEMS,
    ...ADMIN_FOOTER_NAV_ITEMS,
    ...MULTI_ORG_SETTINGS_NAV_ITEMS,
    SHEPHERD_NAV_ITEM,
    SUPER_ADMIN_NAV_ITEM,
  ]) {
    if (seen.has(item.href)) continue;
    seen.add(item.href);
    items.push(item);
  }

  return items;
}

export function getActiveNavItem(pathname: string): AppNavItem | null {
  return (
    getAllAppNavItems()
      .filter((item) => item.match(pathname))
      .sort((a, b) => b.href.length - a.href.length)[0] ?? null
  );
}

export function getActiveNavGroupLabel(pathname: string): string | undefined {
  const active = getActiveNavItem(pathname);
  if (!active) return undefined;

  if (active.href === HOME_NAV_ITEM.href) return undefined;
  if (MANAGE_NAV_ITEMS.some((item) => item.href === active.href)) return "Manage";
  if (MULTI_ORG_MANAGE_NAV_ITEMS.some((item) => item.href === active.href)) {
    return "Manage";
  }
  if (CONTENT_NAV_ITEMS.some((item) => item.href === active.href)) return "Content";
  if (COMMUNITY_NAV_ITEMS.some((item) => item.href === active.href)) {
    return "Community";
  }
  if (ADMIN_FOOTER_NAV_ITEMS.some((item) => item.href === active.href)) {
    return "Organization";
  }
  if (MULTI_ORG_SETTINGS_NAV_ITEMS.some((item) => item.href === active.href)) {
    return "Organization";
  }
  if (active.href === SHEPHERD_NAV_ITEM.href) return "Tools";
  return undefined;
}

/** Sections that should use the accordion pattern when labeled. */
export function isSidebarSectionCollapsible(section: SidebarNavSection): boolean {
  if (section.collapsible === false) return false;
  if (!section.label) return false;
  return section.items.length > 0;
}
