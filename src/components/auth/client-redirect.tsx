"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AuthLoading } from "@/components/auth/auth-loading";

/**
 * Navigates away from a Server Component without throwing NEXT_REDIRECT during
 * render. An in-render `redirect()` from a layout answers soft navigations with
 * 200 instead of 307 and trips a hook-count mismatch inside Next's AppRouter
 * (vercel/next.js#78396), which surfaces as a client-side exception.
 */
export function ClientRedirect({ to }: { to: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(to);
  }, [router, to]);

  return <AuthLoading />;
}
