"use client";

import { AuthLoading } from "@/components/auth/auth-loading";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useWorkspaceAccess } from "@/hooks/use-workspace-access";

/**
 * Blocks the UI until Firebase auth and the Firestore user profile are ready.
 * Prevents onboarding/dashboard flicker from stale cache or in-flight profile loads.
 */
export function WorkspaceBootstrapGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authUser, loading: authLoading, profileReady } = useFirebaseAuth();
  const { loading: workspaceLoading } = useWorkspaceAccess();

  const waitingForAuth = authLoading;
  const waitingForProfile = Boolean(authUser) && !profileReady;
  const waitingForWorkspace = Boolean(authUser) && profileReady && workspaceLoading;

  if (waitingForAuth || waitingForProfile || waitingForWorkspace) {
    return <AuthLoading />;
  }

  return <>{children}</>;
}
