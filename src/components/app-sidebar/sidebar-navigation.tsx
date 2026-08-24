"use client";

import {
  ADMIN_FOOTER_NAV_ITEMS,
  getAdminSidebarSections,
  getMemberSidebarSections,
  MULTI_ORG_SETTINGS_NAV_ITEMS,
} from "@/config/app-sidebar-nav";
import { isMultiChurchOrgWorkspace } from "@/lib/organization/workspace-type";

import { useChurchManagementAccess } from "@/hooks/use-church-management-access";
import { useOrganizationOptional } from "@/context/organization-context";

import { ChurchSwitcherCard } from "./church-switcher-card";
import { SidebarFooterNav } from "./sidebar-footer-nav";
import { SidebarNavSections } from "./sidebar-nav-section";

export function SidebarNavigation() {
  const { canAccessChurchManagement } = useChurchManagementAccess();
  const organizationContext = useOrganizationOptional();
  const organization = organizationContext?.organization;
  const churches = organizationContext?.churches ?? [];
  const isMultiOrg = isMultiChurchOrgWorkspace(organization);

  if (canAccessChurchManagement) {
    return (
      <div className="flex min-h-0 flex-1 flex-col pb-4">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ChurchSwitcherCard />
          <SidebarNavSections
            sections={getAdminSidebarSections(organization, churches)}
            showBadges={!isMultiOrg}
          />
        </div>
        <SidebarFooterNav
          items={isMultiOrg ? MULTI_ORG_SETTINGS_NAV_ITEMS : ADMIN_FOOTER_NAV_ITEMS}
          className="shrink-0"
        />
      </div>
    );
  }

  return <SidebarNavSections sections={getMemberSidebarSections()} />;
}
