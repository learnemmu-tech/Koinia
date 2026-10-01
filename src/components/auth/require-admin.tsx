"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { useAuth } from "@clerk/nextjs";

import { AuthLoading } from "@/components/auth/auth-loading";
import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useMembershipRouting } from "@/hooks/use-membership-routing";
import { useWorkspaceAccess } from "@/hooks/use-workspace-access";
import type { MembershipRoutingResult } from "@/lib/auth/membership-routing";
import { canEnterDashboard } from "@/lib/auth/workspace-access";
import { isWorkspaceRoute, WORKSPACE_BASE } from "@/lib/dashboard-routes";

type RequireWorkspaceAccessProps = {
  children: React.ReactNode;
};

function shouldBlockForRouting(
  routing: MembershipRoutingResult,
  pathname: string,
  canAccessWorkspace: boolean
): boolean {
  const { destination, status } = routing;
  if (destination === pathname) return false;

  if (status === "active" && isWorkspaceRoute(pathname)) {
    if (
      canAccessWorkspace ||
      destination === WORKSPACE_BASE ||
      isWorkspaceRoute(destination)
    ) {
      return false;
    }
  }

  return true;
}

export function RequireWorkspaceAccess({ children }: RequireWorkspaceAccessProps) {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const { user, loading: authLoading, profileReady } = useFirebaseAuth();
  const { loading: workspaceLoading, input: workspaceInput } = useWorkspaceAccess();
  // Dashboard access is administrative, not "any active member".
  const canAccessWorkspace = canEnterDashboard(workspaceInput);
  const { routing, loading: routingLoading } = useMembershipRouting();
  const router = useRouter();

  const needsRoutingCheck =
    Boolean(user) && !canAccessWorkspace && routingLoading;

  React.useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace(`/signin?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    if (authLoading || !profileReady || workspaceLoading || needsRoutingCheck) {
      return;
    }

    if (routing && shouldBlockForRouting(routing, pathname, canAccessWorkspace)) {
      router.replace(routing.destination);
    }
  }, [
    isLoaded,
    isSignedIn,
    user,
    authLoading,
    workspaceLoading,
    needsRoutingCheck,
    routing,
    profileReady,
    router,
    pathname,
    canAccessWorkspace,
  ]);

  if (!isLoaded) return <AuthLoading />;
  if (!isSignedIn) return <AuthLoading />;
  if (authLoading || !profileReady) return <AuthLoading />;
  if (!user) return <AuthLoading />;

  if (routing && shouldBlockForRouting(routing, pathname, canAccessWorkspace)) {
    return <AuthLoading />;
  }

  if (!canAccessWorkspace && (workspaceLoading || needsRoutingCheck)) {
    return <AuthLoading />;
  }

  if (!canAccessWorkspace) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <h1 className="font-heading text-2xl font-bold">Workspace access required</h1>
        <p className="max-w-md text-muted-foreground">
          You do not have permission to access this workspace. If you are joining a
          church, use the invite link from your church administrator.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/">Go to Home</Link>
          </Button>
          <Button asChild>
            <Link href="/signup?callbackUrl=%2Fonboarding">Create a workspace</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/** @deprecated Use RequireWorkspaceAccess */
export const RequireAdmin = RequireWorkspaceAccess;
