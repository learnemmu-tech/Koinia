"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  isOnboardingPath,
  WAITING_APPROVAL_PATH,
} from "@/lib/auth/auth-paths";
import { isWorkspaceRoute } from "@/lib/dashboard-routes";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useWorkspaceAccess } from "@/hooks/use-workspace-access";
import { WORKSPACE_BASE } from "@/lib/dashboard-routes";

const EXEMPT_PATH_PREFIXES = [
  "/signin",
  "/signup",
  "/forgot-password",
  "/join/",
  "/invite/",
  "/access-denied",
  "/membership-removed",
  "/account-suspended",
  "/waiting-approval",
];

function isExemptPath(pathname: string): boolean {
  return EXEMPT_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix)
  );
}

/**
 * Single routing decision for workspace onboarding state.
 * Runs only after auth + profile are ready (see WorkspaceBootstrapGate).
 */
export function OnboardingGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { authUser, profileReady } = useFirebaseAuth();
  const {
    isOnboardingComplete,
    isMembershipPending,
    needsChurchOnboarding,
  } = useWorkspaceAccess();
  const routedRef = useRef<string | null>(null);

  useEffect(() => {
    routedRef.current = null;
  }, [pathname]);

  useEffect(() => {
    if (!authUser || !profileReady) return;
    if (routedRef.current === pathname) return;

    if (isMembershipPending) {
      if (!pathname.startsWith(WAITING_APPROVAL_PATH)) {
        routedRef.current = pathname;
        router.replace(WAITING_APPROVAL_PATH);
      }
      return;
    }

    if (isOnboardingPath(pathname)) {
      if (isOnboardingComplete) {
        const showingSuccess =
          typeof window !== "undefined" &&
          sessionStorage.getItem("onboarding_show_success") === "1";
        if (!showingSuccess) {
          routedRef.current = pathname;
          router.replace(WORKSPACE_BASE);
        }
      }
      return;
    }

    if (isExemptPath(pathname)) return;

    if (needsChurchOnboarding && isWorkspaceRoute(pathname)) {
      routedRef.current = pathname;
      router.replace("/onboarding");
    }
  }, [
    authUser,
    profileReady,
    pathname,
    isOnboardingComplete,
    isMembershipPending,
    needsChurchOnboarding,
    router,
  ]);

  return null;
}
