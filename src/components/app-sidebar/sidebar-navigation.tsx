"use client";

import {
  filterSidebarSectionsForRole,
  getAdminSidebarSections,
  getMemberSidebarSections,
  getPublicSidebarSections,
  getSuperAdminSidebarSections,
} from "@/config/app-sidebar-nav";
import { isMultiChurchOrgWorkspace } from "@/lib/organization/workspace-type";

import { useChurchManagementAccess } from "@/hooks/use-church-management-access";
import { useOrganizationOptional } from "@/context/organization-context";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";

import { SidebarNavSections } from "./sidebar-nav-section";

export function SidebarNavigation() {
  const { canAccessChurchManagement, canManageOrganization } =
    useChurchManagementAccess();
  const { user, profile, loading } = useFirebaseAuth();
  const organizationContext = useOrganizationOptional();
  const organization = organizationContext?.organization;
  const churches = organizationContext?.churches ?? [];
  const isMultiOrg = isMultiChurchOrgWorkspace(organization);

  if (isPlatformSuperAdmin(profile?.platformRole)) {
    return <SidebarNavSections sections={getSuperAdminSidebarSections()} />;
  }

  if (canAccessChurchManagement) {
    return (
      <SidebarNavSections
        sections={filterSidebarSectionsForRole(
          getAdminSidebarSections(organization, churches),
          { canManageOrganization }
        )}
        showBadges={!isMultiOrg}
      />
    );
  }

  if (!loading && !user) {
    return <SidebarNavSections sections={getPublicSidebarSections()} />;
  }

  return <SidebarNavSections sections={getMemberSidebarSections()} />;
}
