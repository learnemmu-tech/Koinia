"use client";

import { useEffect } from "react";

import { AuthLoading } from "@/components/auth/auth-loading";
import { navigateAfterAuth } from "@/lib/firebase-auth-service";

/**
 * Leaves the current App Router tree with a same-origin document navigation.
 * Soft `router.replace()` uses fetchServerResponse; Clerk handshake or a long
 * first compile then surfaces as `TypeError: Failed to fetch`.
 */
export function ClientRedirect({ to }: { to: string }) {
  useEffect(() => {
    navigateAfterAuth(to);
  }, [to]);

  return <AuthLoading />;
}
