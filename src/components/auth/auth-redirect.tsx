"use client";

import { useRouter } from "next/navigation";
import React from "react";

import { AuthLoading } from "@/components/auth/auth-loading";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { fetchPostAuthDestination } from "@/lib/auth/fetch-post-auth-destination";
import { sanitizeCallbackUrl } from "@/lib/callback-url";

type AuthRedirectProps = {
  children: React.ReactNode;
  callbackUrl?: string;
};

/** Redirects authenticated users away from sign-in/sign-up pages. */
export function AuthRedirect({ children, callbackUrl }: AuthRedirectProps) {
  const { user, loading, profileReady } = useFirebaseAuth();
  const router = useRouter();
  const redirectTo = sanitizeCallbackUrl(callbackUrl);

  React.useEffect(() => {
    if (!loading && profileReady && user) {
      void fetchPostAuthDestination(redirectTo).then((destination) => {
        router.replace(destination);
      });
    }
  }, [user, loading, profileReady, router, redirectTo]);

  if (loading || (user && !profileReady)) return <AuthLoading />;
  if (user) return <AuthLoading />;

  return <>{children}</>;
}
