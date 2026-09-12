"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchWithAuth } from "@/lib/api-client";
import { useChurchManagementAccess } from "@/hooks/use-church-management-access";
import { useWorkspaceTenantScope } from "@/hooks/use-workspace-tenant-scope";
import { QUERY_GC_TIME, QUERY_STALE_TIME } from "@/lib/react-query-config";
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
  // After first paint only — never block soft-nav RSC / org for Neon connections.
  const [afterPaint, setAfterPaint] = useState(false);
  useEffect(() => {
    let innerId = 0;
    const outerId = window.requestAnimationFrame(() => {
      innerId = window.requestAnimationFrame(() => setAfterPaint(true));
    });
    return () => {
      window.cancelAnimationFrame(outerId);
      if (innerId) window.cancelAnimationFrame(innerId);
    };
  }, []);

  const enabled =
    afterPaint &&
    !accessLoading &&
    canAccessChurchManagement &&
    !scope.blocked &&
    Boolean(churchId);

  const { data: badges = EMPTY_BADGES } = useQuery({
    queryKey: ["sidebar-admin-badges", churchId, scope.organizationId],
    enabled,
    refetchInterval: 5 * 60_000,
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async () => {
      const orgId = scope.organizationId ?? "";
      const [prayersRes, membersRes] = await Promise.all([
        fetchWithAuth(
          `/api/tenant-content?${new URLSearchParams({
            collection: "prayerRequests",
            churchId,
            organizationId: orgId,
            status: "pending",
            countOnly: "true",
            limit: "1",
          }).toString()}`
        ),
        fetchWithAuth(
          `/api/memberships/pending?organizationId=${encodeURIComponent(orgId)}&branchId=${encodeURIComponent(churchId)}`
        ),
      ]);

      const pendingPrayers = prayersRes.ok
        ? ((await prayersRes.json()) as { count?: number }).count ?? 0
        : 0;
      const pendingMembers = membersRes.ok
        ? (
            (await membersRes.json()) as {
              pending: FirebaseBranchMembership[];
            }
          ).pending.length
        : 0;

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
