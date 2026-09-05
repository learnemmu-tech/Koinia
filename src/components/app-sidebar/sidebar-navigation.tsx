"use client";

import {
  getAdminSidebarSections,
  getMemberSidebarSections,
} from "@/config/app-sidebar-nav";
import { isMultiChurchOrgWorkspace } from "@/lib/organization/workspace-type";

import { useChurchManagementAccess } from "@/hooks/use-church-management-access";
import { useOrganizationOptional } from "@/context/organization-context";

import { SidebarNavSections } from "./sidebar-nav-section";

export function SidebarNavigation() {
  const { canAccessChurchManagement } = useChurchManagementAccess();
  const organizationContext = useOrganizationOptional();
  const organization = organizationContext?.organization;
  const churches = organizationContext?.churches ?? [];
  const isMultiOrg = isMultiChurchOrgWorkspace(organization);

  if (canAccessChurchManagement) {
    return (
      <SidebarNavSections
        sections={getAdminSidebarSections(organization, churches)}
        showBadges={!isMultiOrg}
      />
    );
  }

  return <SidebarNavSections sections={getMemberSidebarSections()} />;
}
