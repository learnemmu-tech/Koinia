"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";

import { useChurchManagementAccess } from "@/hooks/use-church-management-access";
import { useWorkspaceTenantScope } from "@/hooks/use-workspace-tenant-scope";
import { db } from "@/lib/firebase";
import { BRANCH_MEMBERSHIPS_COLLECTION } from "@/lib/organization/branch-membership-firestore";
import { PRAYER_REQUESTS_COLLECTION } from "@/lib/prayer-request-firestore";

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
  const [badges, setBadges] = useState<SidebarAdminBadges>(EMPTY_BADGES);

  useEffect(() => {
    if (accessLoading || !canAccessChurchManagement || scope.blocked) {
      setBadges(EMPTY_BADGES);
      return;
    }

    const churchId = scope.churchId?.trim();

    if (!churchId) {
      setBadges(EMPTY_BADGES);
      return;
    }

    let pendingPrayers = 0;
    let pendingMembers = 0;

    const prayersQuery = query(
      collection(db, PRAYER_REQUESTS_COLLECTION),
      where("churchId", "==", churchId),
      where("status", "==", "pending")
    );

    const membersQuery = query(
      collection(db, BRANCH_MEMBERSHIPS_COLLECTION),
      where("churchId", "==", churchId),
      where("status", "==", "pending")
    );

    const unsubscribePrayers = onSnapshot(
      prayersQuery,
      (snapshot) => {
        pendingPrayers = snapshot.size;
        setBadges({
          pendingPrayers,
          pendingMembers,
          pendingContent: pendingPrayers + pendingMembers,
        });
      },
      () => {
        pendingPrayers = 0;
        setBadges({
          pendingPrayers,
          pendingMembers,
          pendingContent: pendingPrayers + pendingMembers,
        });
      }
    );

    const unsubscribeMembers = onSnapshot(
      membersQuery,
      (snapshot) => {
        pendingMembers = snapshot.size;
        setBadges({
          pendingPrayers,
          pendingMembers,
          pendingContent: pendingPrayers + pendingMembers,
        });
      },
      () => {
        pendingMembers = 0;
        setBadges({
          pendingPrayers,
          pendingMembers,
          pendingContent: pendingPrayers + pendingMembers,
        });
      }
    );

    return () => {
      unsubscribePrayers();
      unsubscribeMembers();
    };
  }, [
    accessLoading,
    canAccessChurchManagement,
    scope.blocked,
    scope.churchId,
  ]);

  if (!canAccessChurchManagement) return EMPTY_BADGES;

  return badges;
}
