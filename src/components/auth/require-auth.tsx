"use client";

import { useRouter } from "next/navigation";
import React from "react";

import { AuthLoading } from "@/components/auth/auth-loading";
import { useFirebaseAuth } from "@/context/firebase-auth-context";

type RequireAuthProps = {
  children: React.ReactNode;
};

/** Client-side guard for protected pages. */
export function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading } = useFirebaseAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace("/signin");
    }
  }, [user, loading, router]);

  if (loading) return <AuthLoading />;
  if (!user) return <AuthLoading />;

  return <>{children}</>;
}
