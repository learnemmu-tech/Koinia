"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useMembershipRouting } from "@/hooks/use-membership-routing";
import { useMembershipRealtimeSync } from "@/hooks/use-membership-realtime-sync";
import {
  ACCESS_DENIED_PATH,
  ACCOUNT_SUSPENDED_PATH,
  isInvitePath,
  isJoinPath,
  isOnboardingPath,
  isWaitingApprovalPath,
  MEMBERSHIP_REMOVED_PATH,
  WAITING_APPROVAL_PATH,
} from "@/lib/auth/auth-paths";
import { WORKSPACE_BASE } from "@/lib/dashboard-routes";

const AUTH_PATHS = new Set([
  "/signin",
  "/signup",
  "/forgot-password",
]);

function isExemptMembershipPath(pathname: string): boolean {
  if (AUTH_PATHS.has(pathname)) return true;
  if (isOnboardingPath(pathname)) return true;
  if (isJoinPath(pathname)) return true;
  if (isInvitePath(pathname)) return true;
  if (pathname === ACCESS_DENIED_PATH) return true;
  if (pathname === MEMBERSHIP_REMOVED_PATH) return true;
  if (pathname === ACCOUNT_SUSPENDED_PATH) return true;
  return false;
}

/**
 * Redirects members based on branch membership status on every navigation.
 */
export function MembershipStatusGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { authUser, loading: authLoading, profileReady } = useFirebaseAuth();
  const { routing, loading: routingLoading } = useMembershipRouting(pathname);
  const redirectingRef = useRef(false);

  useMembershipRealtimeSync();

  useEffect(() => {
    redirectingRef.current = false;
  }, [pathname]);

  useEffect(() => {
    if (!authUser || authLoading || !profileReady || routingLoading || !routing) return;
    if (redirectingRef.current) return;

    const { status, destination } = routing;

    if (status === "pending") {
      if (!isWaitingApprovalPath(pathname) && !isExemptMembershipPath(pathname)) {
        redirectingRef.current = true;
        router.replace(WAITING_APPROVAL_PATH);
      }
      return;
    }

    if (isWaitingApprovalPath(pathname)) {
      if (status === "active") {
        redirectingRef.current = true;
        router.replace(destination || WORKSPACE_BASE);
        return;
      }
      if (status === "rejected") {
        redirectingRef.current = true;
        router.replace(ACCESS_DENIED_PATH);
        return;
      }
      if (status === "removed") {
        redirectingRef.current = true;
        router.replace(MEMBERSHIP_REMOVED_PATH);
        return;
      }
      if (status === "suspended") {
        redirectingRef.current = true;
        router.replace(ACCOUNT_SUSPENDED_PATH);
        return;
      }
    }

    if (status === "rejected" && pathname !== ACCESS_DENIED_PATH) {
      redirectingRef.current = true;
      router.replace(ACCESS_DENIED_PATH);
      return;
    }

    if (status === "removed" && pathname !== MEMBERSHIP_REMOVED_PATH) {
      redirectingRef.current = true;
      router.replace(MEMBERSHIP_REMOVED_PATH);
      return;
    }

    if (status === "suspended" && pathname !== ACCOUNT_SUSPENDED_PATH) {
      redirectingRef.current = true;
      router.replace(ACCOUNT_SUSPENDED_PATH);
    }
  }, [
    authUser,
    authLoading,
    profileReady,
    routingLoading,
    routing,
    pathname,
    router,
  ]);

  return null;
}
