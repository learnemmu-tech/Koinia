import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  LayoutDashboard,
  Users,
} from "lucide-react";

const BASE = "/dashboard";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
  superAdminOnly?: boolean;
};

/** Legacy admin shell navigation — workspace sidebar uses app-sidebar-nav. */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: BASE,
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (pathname) => pathname === BASE,
  },
  {
    href: `${BASE}/analytics`,
    label: "Analytics",
    icon: BarChart3,
    match: (pathname) => pathname.startsWith(`${BASE}/analytics`),
  },
  {
    href: `${BASE}/organization?tab=members`,
    label: "Members",
    icon: Users,
    match: (pathname) =>
      pathname.startsWith(`${BASE}/organization`) ||
      pathname.startsWith(`${BASE}/users`),
  },
];
