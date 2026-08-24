import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Church,
  CreditCard,
  HeartHandshake,
  Mail,
  Settings2,
  Shield,
} from "lucide-react";

export type ChurchManagementNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  match: (pathname: string, searchParams: URLSearchParams) => boolean;
};

const ADMIN_BASE = "/dashboard";

export const CHURCH_MANAGEMENT_NAV_ITEMS: ChurchManagementNavItem[] = [
  {
    label: "General",
    href: `${ADMIN_BASE}/organization?tab=settings`,
    icon: Settings2,
    match: (pathname, searchParams) =>
      pathname.startsWith(`${ADMIN_BASE}/organization`) &&
      (searchParams.get("tab") === "settings" || !searchParams.get("tab")),
  },
  {
    label: "Churches",
    href: `${ADMIN_BASE}/organization?tab=churches`,
    icon: Church,
    match: (pathname, searchParams) =>
      pathname.startsWith(`${ADMIN_BASE}/organization`) &&
      searchParams.get("tab") === "churches",
  },
  {
    label: "Invitations",
    href: `${ADMIN_BASE}/organization?tab=invitations`,
    icon: Mail,
    match: (pathname, searchParams) =>
      pathname.startsWith(`${ADMIN_BASE}/organization`) &&
      searchParams.get("tab") === "invitations",
  },
  {
    label: "Roles & Permissions",
    href: `${ADMIN_BASE}/organization?tab=roles`,
    icon: Shield,
    match: (pathname, searchParams) =>
      pathname.startsWith(`${ADMIN_BASE}/organization`) &&
      searchParams.get("tab") === "roles",
  },
  {
    label: "Donation Settings",
    href: `${ADMIN_BASE}/donations`,
    icon: HeartHandshake,
    match: (pathname) => pathname.startsWith(`${ADMIN_BASE}/donations`),
  },
  {
    label: "Billing & Subscription",
    href: `${ADMIN_BASE}/billing`,
    icon: CreditCard,
    match: (pathname) => pathname.startsWith(`${ADMIN_BASE}/billing`),
  },
];

export function isChurchManagementPath(pathname: string): boolean {
  return (
    pathname.startsWith(`${ADMIN_BASE}/organization`) ||
    pathname.startsWith(`${ADMIN_BASE}/church-settings`) ||
    pathname.startsWith(`${ADMIN_BASE}/billing`) ||
    pathname.startsWith(`${ADMIN_BASE}/donations`)
  );
}

export const CHURCH_MANAGEMENT_GROUP_LABEL = "Church Management";
export const CHURCH_MANAGEMENT_GROUP_ICON = Building2;
