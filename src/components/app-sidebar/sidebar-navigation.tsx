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
import { useSubscriptionOptional } from "@/context/subscription-context";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import { useAuth } from "@clerk/nextjs";

import { SidebarNavSections } from "./sidebar-nav-section";

export function SidebarNavigation() {
  const { canAccessChurchManagement, canManageOrganization } =
    useChurchManagementAccess();
  const { user, profile, loading } = useFirebaseAuth();
  const { isSignedIn } = useAuth();
  const organizationContext = useOrganizationOptional();
  const subscription = useSubscriptionOptional();
  const organization = organizationContext?.organization;
  const churches = organizationContext?.churches ?? [];
  const isMultiOrg = isMultiChurchOrgWorkspace(organization);
  const canUseShepherdAi = subscription?.canUseFeature("canUseShepherdAi") ?? false;

  if (isPlatformSuperAdmin(profile?.platformRole)) {
    return <SidebarNavSections sections={getSuperAdminSidebarSections()} />;
  }

  if (canAccessChurchManagement) {
    return (
      <SidebarNavSections
        sections={filterSidebarSectionsForRole(
          getAdminSidebarSections(organization, churches),
          { canManageOrganization, canUseShepherdAi }
        )}
        showBadges={!isMultiOrg}
      />
    );
  }

  if (!loading && !user && !isSignedIn) {
    return <SidebarNavSections sections={getPublicSidebarSections()} />;
  }

  return (
    <SidebarNavSections
      sections={filterSidebarSectionsForRole(getMemberSidebarSections(), {
        canManageOrganization: false,
        canUseShepherdAi,
      })}
      isAuthenticated
    />
  );
}
