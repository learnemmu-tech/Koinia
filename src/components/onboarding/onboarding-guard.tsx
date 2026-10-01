"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import {
  CREATE_WORKSPACE_PATH,
  isOnboardingFormPath,
  isOnboardingSuccessPath,
  isOnboardingWebsitePath,
  ONBOARDING_WEBSITE_PATH,
  SUPER_ADMIN_BASE,
  WAITING_APPROVAL_PATH,
} from "@/lib/auth/auth-paths";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import { shouldRedirectAuthenticatedSuperAdminFromPath } from "@/lib/auth/super-admin-routing";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useWorkspaceAccess } from "@/hooks/use-workspace-access";
import { WORKSPACE_BASE } from "@/lib/dashboard-routes";

const EXEMPT_PATH_PREFIXES = [
  "/signin",
  "/signup",
  "/forgot-password",
  "/sso-callback",
  "/auth/continue",
  "/join/",
  "/invite/",
  "/c/",
  "/preview/website",
  "/access-denied",
  "/membership-removed",
  "/account-suspended",
  "/waiting-approval",
  "/super-admin",
];

function isExemptPath(pathname: string): boolean {
  return EXEMPT_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix)
  );
}

/**
 * First-time flow:
 * onboarding form → website templates → success → dashboard.
 * Never sends a brand-new church to Dashboard while website setup is open.
 */
export function OnboardingGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const { authUser, profile, profileReady } = useFirebaseAuth();
  const { isMembershipPending } = useWorkspaceAccess();
  const routedRef = useRef<string | null>(null);

  useEffect(() => {
    routedRef.current = null;
  }, [pathname]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) return;
    if (!authUser || !profileReady) return;
    if (routedRef.current === pathname) return;

    if (isPlatformSuperAdmin(profile?.platformRole)) {
      if (shouldRedirectAuthenticatedSuperAdminFromPath(pathname)) {
        routedRef.current = pathname;
        router.replace(SUPER_ADMIN_BASE);
      }
      return;
    }

    if (isMembershipPending) {
      if (!pathname.startsWith(WAITING_APPROVAL_PATH)) {
        routedRef.current = pathname;
        router.replace(WAITING_APPROVAL_PATH);
      }
      return;
    }

    const onboardingDone = profile?.needsChurchOnboarding === false;
    const websiteSetupDone = profile?.websiteSetupCompleted !== false;

    if (isOnboardingFormPath(pathname)) {
      if (!onboardingDone) return;
      routedRef.current = pathname;
      router.replace(
        websiteSetupDone ? WORKSPACE_BASE : ONBOARDING_WEBSITE_PATH
      );
      return;
    }

    if (isOnboardingWebsitePath(pathname)) {
      if (!onboardingDone) {
        routedRef.current = pathname;
        router.replace(CREATE_WORKSPACE_PATH);
      }
      return;
    }

    if (isOnboardingSuccessPath(pathname)) {
      if (!onboardingDone) {
        routedRef.current = pathname;
        router.replace(CREATE_WORKSPACE_PATH);
        return;
      }
      if (!websiteSetupDone) {
        routedRef.current = pathname;
        router.replace(ONBOARDING_WEBSITE_PATH);
      }
      return;
    }

    if (isExemptPath(pathname)) return;

    if (!onboardingDone) {
      routedRef.current = pathname;
      router.replace(CREATE_WORKSPACE_PATH);
      return;
    }

    if (!websiteSetupDone) {
      routedRef.current = pathname;
      router.replace(ONBOARDING_WEBSITE_PATH);
    }
  }, [
    isLoaded,
    isSignedIn,
    authUser,
    profileReady,
    pathname,
    isMembershipPending,
    router,
    profile,
  ]);

  return null;
}
