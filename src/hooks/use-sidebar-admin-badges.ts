"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchTenantContentPage } from "@/lib/api-client";
import { useChurchManagementAccess } from "@/hooks/use-church-management-access";
import { useWorkspaceTenantScope } from "@/hooks/use-workspace-tenant-scope";
import { QUERY_GC_TIME, QUERY_STALE_TIME } from "@/lib/react-query-config";
import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";
import type { FirebaseBranchMembership } from "@/types/branch-membership";

export type SidebarAdminBadges = {
  pendingPrayers: number;
  pendingMembers: number;
  pendingContent: number;
};

const EMPTY_BADGES: SidebarAdminBadges = {
  pendingPrayers: 0,
  pendingMembers: 0,
  pendingContent: 0,
};

export function useSidebarAdminBadges(): SidebarAdminBadges {
  const { canAccessChurchManagement, loading: accessLoading } =
    useChurchManagementAccess();
  const scope = useWorkspaceTenantScope();
  const churchId = scope.churchId?.trim() ?? "";
  const enabled =
    !accessLoading &&
    canAccessChurchManagement &&
    !scope.blocked &&
    Boolean(churchId);

  const { data: badges = EMPTY_BADGES } = useQuery({
    queryKey: ["sidebar-admin-badges", churchId, scope.organizationId],
    enabled,
    refetchInterval: 60_000,
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    queryFn: async () => {
      const [prayers, membersRes] = await Promise.all([
        fetchTenantContentPage<FirebasePrayerRequest>({
          collection: "prayerRequests",
          churchId,
          organizationId: scope.organizationId,
          limit: 50,
        }),
        (async () => {
          const { fetchWithAuth } = await import("@/lib/api-client");
          const response = await fetchWithAuth(
            `/api/memberships/pending?organizationId=${encodeURIComponent(scope.organizationId ?? "")}&branchId=${encodeURIComponent(churchId)}`
          );
          if (!response.ok) return { pending: [] as FirebaseBranchMembership[] };
          return response.json() as Promise<{ pending: FirebaseBranchMembership[] }>;
        })(),
      ]);
      const pendingPrayers = prayers.items.filter(
        (item) => item.status === "pending"
      ).length;
      const pendingMembers = membersRes.pending.length;
      return {
        pendingPrayers,
        pendingMembers,
        pendingContent: pendingPrayers,
      };
    },
  });

  if (!canAccessChurchManagement) return EMPTY_BADGES;
  return badges;
}
