"use client";

import { AuthLoading } from "@/components/auth/auth-loading";
import { useFirebaseAuth } from "@/context/firebase-auth-context";

/**
 * Signed-in users wait only until the PostgreSQL profile is ready.
 * Anonymous visitors are not blocked on Clerk hydration — public pages
 * must render immediately. After the first successful bootstrap,
 * background auth/org work must not unmount the tree (that remounts open forms).
 */
export function WorkspaceBootstrapGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authUser, profileReady } = useFirebaseAuth();

  if (!authUser || profileReady) {
    return <>{children}</>;
  }

  return <AuthLoading />;
}
