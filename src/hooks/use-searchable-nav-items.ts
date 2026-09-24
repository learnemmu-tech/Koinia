"use client";

import {
  filterSidebarSectionsForRole,
  getAdminSidebarSections,
  getMemberSidebarSections,
  getPublicSidebarSections,
  getSuperAdminSidebarSections,
} from "@/config/app-sidebar-nav";
import { useChurchManagementAccess } from "@/hooks/use-church-management-access";
import { useOrganizationOptional } from "@/context/organization-context";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useSubscriptionOptional } from "@/context/subscription-context";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import { flattenVisibleSidebarNavItems } from "@/lib/nav-search";
import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";

/**
 * Role-aware nav destinations for global search.
 * Uses the same section sources + visibility rules as the sidebar
 * (including superAdminOnly / authOnly).
 */
export function useSearchableNavItems() {
  const { canAccessChurchManagement, canManageOrganization } =
    useChurchManagementAccess();
  const { user, profile, loading } = useFirebaseAuth();
  const { isSignedIn } = useAuth();
  const organizationContext = useOrganizationOptional();
  const subscription = useSubscriptionOptional();
  const organization = organizationContext?.organization;
  const canUseShepherdAi = subscription?.canUseFeature("canUseShepherdAi") ?? false;

  return useMemo(() => {
    const churches = organizationContext?.churches ?? [];
    const isSuperAdmin = isPlatformSuperAdmin(profile?.platformRole);
    const isAuthenticated = Boolean(user) || Boolean(isSignedIn);
    const visibility = { isSuperAdmin, isAuthenticated };

    if (isSuperAdmin) {
      return flattenVisibleSidebarNavItems(
        getSuperAdminSidebarSections(),
        visibility
      );
    }

    if (canAccessChurchManagement) {
      return flattenVisibleSidebarNavItems(
        filterSidebarSectionsForRole(
          getAdminSidebarSections(organization, churches),
          { canManageOrganization, canUseShepherdAi }
        ),
        visibility
      );
    }

    if (!loading && !user && !isSignedIn) {
      return flattenVisibleSidebarNavItems(
        getPublicSidebarSections(),
        visibility
      );
    }

    return flattenVisibleSidebarNavItems(
      filterSidebarSectionsForRole(getMemberSidebarSections(), {
        canManageOrganization: false,
        canUseShepherdAi,
      }),
      visibility
    );
  }, [
    canAccessChurchManagement,
    canManageOrganization,
    canUseShepherdAi,
    isSignedIn,
    loading,
    organization,
    organizationContext?.churches,
    profile?.platformRole,
    user,
  ]);
}
