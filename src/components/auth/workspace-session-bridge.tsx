"use client";

import { useEffect } from "react";

import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useOrganization } from "@/context/organization-context";
import { setAuthSession } from "@/lib/auth/set-auth-session";
import { getWorkspaceType } from "@/lib/organization/workspace-type";

/**
 * Keeps middleware cookie hints in sync with Firestore profile + membership.
 * Cookies are a cache only — OnboardingGuard and RequireWorkspaceAccess enforce truth.
 */
export function WorkspaceSessionBridge() {
  const { authUser, profile } = useFirebaseAuth();
  const { membership, churches, organization, loading } = useOrganization();

  useEffect(() => {
    if (!authUser) return;

    setAuthSession(true, {
      role: profile?.role ?? "user",
      profile,
      membership,
      churchesCount: churches.length,
      workspaceType: getWorkspaceType(organization),
    });
  }, [authUser, profile, membership, churches.length, organization]);

  // Avoid flashing wrong cookie state before org snapshot loads
  void loading;

  return null;
}
