import {
  CHURCH_MANAGEMENT_NAV_ITEMS,
  type ChurchManagementNavItem,
} from "@/config/church-management-nav";
import { isIndependentChurchWorkspace } from "@/lib/organization/workspace-type";
import { Settings2 } from "lucide-react";

const ADMIN_BASE = "/dashboard";

const INDEPENDENT_HIDDEN_LABELS = new Set([
  "Churches",
  "Invitations",
  "Roles & Permissions",
  "General",
]);

const INDEPENDENT_CHURCH_SETTINGS: ChurchManagementNavItem = {
  label: "Church Settings",
  href: `${ADMIN_BASE}/church-settings`,
  icon: Settings2,
  match: (pathname) => pathname.startsWith(`${ADMIN_BASE}/church-settings`),
};

export function getChurchManagementNavItems(
  organization: Parameters<typeof isIndependentChurchWorkspace>[0]
): ChurchManagementNavItem[] {
  if (!isIndependentChurchWorkspace(organization)) {
    return CHURCH_MANAGEMENT_NAV_ITEMS;
  }

  return [
    INDEPENDENT_CHURCH_SETTINGS,
    ...CHURCH_MANAGEMENT_NAV_ITEMS.filter(
      (item) => !INDEPENDENT_HIDDEN_LABELS.has(item.label)
    ),
  ];
}
