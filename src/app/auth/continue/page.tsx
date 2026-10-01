"use client";

import { Suspense, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthLoading } from "@/components/auth/auth-loading";
import { CREATE_WORKSPACE_PATH } from "@/lib/auth/auth-paths";
import { sanitizeCallbackUrl } from "@/lib/callback-url";
import { navigateAfterAuth } from "@/lib/firebase-auth-service";

function AuthContinueClient() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const startedRef = useRef(false);
  const callbackUrl = sanitizeCallbackUrl(
    searchParams.get("callbackUrl"),
    CREATE_WORKSPACE_PATH
  );

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.replace(
        `/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`
      );
      return;
    }

    if (startedRef.current) return;
    startedRef.current = true;

    void (async () => {
      try {
        const token = await getToken();
        if (!token) {
          navigateAfterAuth(CREATE_WORKSPACE_PATH);
          return;
        }
        const params = new URLSearchParams({ callbackUrl });
        const res = await fetch(`/api/auth/routing?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await res.json().catch(() => ({}))) as {
          destination?: string;
        };
        navigateAfterAuth(data.destination || CREATE_WORKSPACE_PATH);
      } catch {
        navigateAfterAuth(CREATE_WORKSPACE_PATH);
      }
    })();
  }, [isLoaded, isSignedIn, callbackUrl, getToken, router]);

  return <AuthLoading />;
}

export default function AuthContinuePage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <AuthContinueClient />
    </Suspense>
  );
}
