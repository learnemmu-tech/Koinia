"use client";

import { useAuth } from "@clerk/nextjs";
import React from "react";

import { AuthLoading } from "@/components/auth/auth-loading";
import { CREATE_WORKSPACE_PATH } from "@/lib/auth/auth-paths";
import { sanitizeCallbackUrl } from "@/lib/callback-url";
import { navigateAfterAuth } from "@/lib/firebase-auth-service";

type AuthRedirectProps = {
  children: React.ReactNode;
  callbackUrl?: string;
};

/** Redirects authenticated users away from sign-in/sign-up pages. */
export function AuthRedirect({ children, callbackUrl }: AuthRedirectProps) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const redirectTo = sanitizeCallbackUrl(callbackUrl, CREATE_WORKSPACE_PATH);
  const redirectedRef = React.useRef(false);

  React.useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      redirectedRef.current = false;
      return;
    }
    if (redirectedRef.current) return;
    redirectedRef.current = true;

    const continueAuthenticated = async () => {
      try {
        const token = await getToken();
        if (!token) {
          navigateAfterAuth(redirectTo);
          return;
        }
        const params = new URLSearchParams({ callbackUrl: redirectTo });
        const res = await fetch(`/api/auth/routing?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await res.json().catch(() => ({}))) as {
          destination?: string;
        };
        navigateAfterAuth(data.destination || redirectTo);
      } catch {
        navigateAfterAuth(redirectTo);
      }
    };

    void continueAuthenticated();
  }, [isLoaded, isSignedIn, redirectTo, getToken]);

  if (!isLoaded) return <AuthLoading />;
  if (isSignedIn) return <AuthLoading />;

  return <>{children}</>;
}
