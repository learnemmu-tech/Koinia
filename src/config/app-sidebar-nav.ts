import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Bookmark,
  CalendarDays,
  Church,
  CreditCard,
  FileText,
  HandHelping,
  Heart,
  Home,
  Layers,
  LayoutDashboard,
  Music,
  Settings2,
  Users,
} from "lucide-react";

import type { FirebaseChurch } from "@/types/firebase-church";
import type { FirebaseOrganization } from "@/types/organization";
import { isMultiChurchOrgWorkspace } from "@/lib/organization/workspace-type";

export type AppNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
  /** Optional badge count (admin sidebar). */
  badgeKey?: "pendingPrayers" | "pendingContent";
  superAdminOnly?: boolean;
  authOnly?: boolean;
};

export type SidebarNavSection = {
  label?: string;
  items: AppNavItem[];
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
};

export const MANAGE_NAV_ITEMS: AppNavItem[] = [
  {
    label: "Dashboard",
    href: ADMIN_BASE,
    icon: LayoutDashboard,
    match: exact(ADMIN_BASE),
  },
  {
    label: "Members",
    href: `${ADMIN_BASE}/members`,
    icon: Users,
    match: (pathname) =>
      pathname.startsWith(`${ADMIN_BASE}/members`) ||
      pathname.startsWith(`${ADMIN_BASE}/users`),
  },
  {
    label: "Analytics",
    href: `${ADMIN_BASE}/analytics`,
    icon: BarChart3,
    match: startsWith(`${ADMIN_BASE}/analytics`),
  },
  {
    label: "Content Management",
    href: `${ADMIN_BASE}/content`,
    icon: Layers,
    match: startsWith(`${ADMIN_BASE}/content`),
    badgeKey: "pendingContent",
  },
];

export const BROWSE_NAV_ITEMS: AppNavItem[] = [
  { label: "Songs", href: "/songs", icon: Music, match: startsWith("/songs") },
  {
    label: "Sermons",
    href: "/sermons",
    icon: BookOpen,
    match: startsWith("/sermons"),
  },
  {
    label: "Articles",
    href: "/articles",
    icon: FileText,
    match: startsWith("/articles"),
  },
  {
    label: "Events",
    href: "/events",
    icon: CalendarDays,
    match: startsWith("/events"),
  },
  {
    label: "Donations",
    href: "/donations",
    icon: Heart,
    match: startsWith("/donations"),
  },
  {
    label: "Prayer Requests",
    href: "/prayer-requests",
    icon: HandHelping,
    match: startsWith("/prayer-requests"),
    badgeKey: "pendingPrayers",
  },
  {
    label: "Library",
    href: "/favorites",
    icon: Bookmark,
    match: startsWith("/favorites"),
    authOnly: true,
  },
];

export const ADMIN_FOOTER_NAV_ITEMS: AppNavItem[] = [
  {
    label: "Church Settings",
    href: `${ADMIN_BASE}/church-settings`,
    icon: Settings2,
    match: startsWith(`${ADMIN_BASE}/church-settings`),
  },
  {
    label: "Billing",
    href: `${ADMIN_BASE}/billing`,
    icon: CreditCard,
    match: startsWith(`${ADMIN_BASE}/billing`),
  },
];

export const MULTI_ORG_MANAGE_NAV_ITEMS: AppNavItem[] = [
  {
    label: "Dashboard",
    href: ADMIN_BASE,
    icon: LayoutDashboard,
    match: exact(ADMIN_BASE),
  },
  {
    label: "Organization Settings",
    href: `${ADMIN_BASE}/organization`,
    icon: Settings2,
    match: startsWith(`${ADMIN_BASE}/organization`),
  },
  {
    label: "Members",
    href: `${ADMIN_BASE}/members`,
    icon: Users,
    match: (pathname) =>
      pathname.startsWith(`${ADMIN_BASE}/members`) ||
      pathname.startsWith(`${ADMIN_BASE}/users`),
  },
  {
    label: "Analytics",
    href: `${ADMIN_BASE}/analytics`,
    icon: BarChart3,
    match: startsWith(`${ADMIN_BASE}/analytics`),
  },
];

export const MULTI_ORG_SETTINGS_NAV_ITEMS: AppNavItem[] = [
  {
    label: "Billing",
    href: `${ADMIN_BASE}/billing`,
    icon: CreditCard,
    match: startsWith(`${ADMIN_BASE}/billing`),
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
    { items: [HOME_NAV_ITEM] },
    { label: "Manage", items: MULTI_ORG_MANAGE_NAV_ITEMS },
    {
      label: "Churches",
      items: [
        ...churchItems,
        {
          label: "Add Church",
          href: `${ADMIN_BASE}?createChurch=1`,
          icon: Church,
          match: () => false,
        },
      ],
    },
  ];
}

export function getAdminSidebarSections(
  organization?: FirebaseOrganization | null,
  churches: FirebaseChurch[] = []
): SidebarNavSection[] {
  if (isMultiChurchOrgWorkspace(organization)) {
    return getMultiOrgAdminSidebarSections(organization, churches);
  }

  const manageItems = [...MANAGE_NAV_ITEMS];

  return [
    { items: [HOME_NAV_ITEM] },
    { label: "Manage", items: manageItems },
    { label: "Browse", items: BROWSE_NAV_ITEMS },
  ];
}

export function getMemberSidebarSections(): SidebarNavSection[] {
  return [
    { items: [HOME_NAV_ITEM] },
    { label: "Browse", items: BROWSE_NAV_ITEMS.map(({ badgeKey: _, ...item }) => item) },
  ];
}

/** @deprecated */
export const HOME_NAV_ITEMS = [HOME_NAV_ITEM];
export const WORKSPACE_NAV_ITEMS = MANAGE_NAV_ITEMS.filter(
  (item) => item.label !== "Content Management"
);
export const CONTENT_NAV_ITEMS = MANAGE_NAV_ITEMS.filter(
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
  return { label: "Content", items: CONTENT_NAV_ITEMS };
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
  const libraryItem = BROWSE_NAV_ITEMS.find((item) => item.label === "Library");
  return {
    label: "Library",
    items: libraryItem ? [libraryItem] : [],
  };
}

export function getAllAppNavItems(): AppNavItem[] {
  return [
    HOME_NAV_ITEM,
    ...MANAGE_NAV_ITEMS,
    ...BROWSE_NAV_ITEMS,
    ...ADMIN_FOOTER_NAV_ITEMS,
  ];
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
  if (BROWSE_NAV_ITEMS.some((item) => item.href === active.href)) return "Browse";
  if (ADMIN_FOOTER_NAV_ITEMS.some((item) => item.href === active.href)) {
    return "Settings";
  }
  return undefined;
}
