"use client";

import { useAuth } from "@clerk/nextjs";

import { AuthLoading } from "@/components/auth/auth-loading";

/**
 * Wait only for Clerk's authoritative session. Do not block first-time
 * onboarding on Firebase shim / profile hydration.
 */
export function WorkspaceBootstrapGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return <AuthLoading />;
  }

  return <>{children}</>;
}
