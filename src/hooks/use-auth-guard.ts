"use client";

import { usePathname } from "next/navigation";
import { useCallback } from "react";

import { useContentAuthDialog } from "@/context/content-auth-dialog-context";
import { useFirebaseAuth } from "@/context/firebase-auth-context";

/**
 * Gate in-app actions (play, like, download, etc.) behind authentication.
 *
 * `ensureAuth` returns true when the user is signed in. Otherwise it opens the
 * sign-in modal (without navigating away) and returns false, so callers can
 * abort the protected action.
 */
export function useAuthGuard() {
  const { user, loading } = useFirebaseAuth();
  const { openDialog } = useContentAuthDialog();
  const pathname = usePathname();

  const ensureAuth = useCallback(
    (callbackPath?: string): boolean => {
      // Auth state not resolved yet — block the action to avoid flashing
      // protected content, but don't pop the modal prematurely.
      if (loading) return false;
      if (user) return true;

      openDialog(callbackPath ?? pathname ?? "/", { redirectOnClose: false });
      return false;
    },
    [loading, user, openDialog, pathname]
  );

  return {
    isAuthenticated: !!user && !loading,
    isResolving: loading,
    ensureAuth,
  };
}
