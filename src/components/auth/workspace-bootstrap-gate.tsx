"use client";

import { AuthLoading } from "@/components/auth/auth-loading";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useWorkspaceAccess } from "@/hooks/use-workspace-access";

/**
 * Blocks the UI until Clerk identity and the PostgreSQL user profile are ready.
 * After the first successful bootstrap for a signed-in user, background
 * auth/org work must not unmount the tree (that remounts open forms).
 */
export function WorkspaceBootstrapGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authUser, loading: authLoading, profileReady } = useFirebaseAuth();
  const { loading: workspaceLoading } = useWorkspaceAccess();

  if (authUser && profileReady) {
    return <>{children}</>;
  }

  const waitingForAuth = authLoading;
  const waitingForProfile = Boolean(authUser) && !profileReady;
  const waitingForWorkspace =
    Boolean(authUser) && profileReady && workspaceLoading;

  if (waitingForAuth || waitingForProfile || waitingForWorkspace) {
    return <AuthLoading />;
  }

  return <>{children}</>;
}
