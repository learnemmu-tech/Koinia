"use client";

import { useRouter } from "next/navigation";
import React from "react";

import { useContentAuthDialog } from "@/context/content-auth-dialog-context";
import { useFirebaseAuth } from "@/context/firebase-auth-context";

type ContentAuthRequiredProps = {
  callbackPath: string;
};

/** Opens the auth dialog for direct content URLs; redirects home if dismissed. */
export function ContentAuthRequired({ callbackPath }: ContentAuthRequiredProps) {
  const { user, loading } = useFirebaseAuth();
  const { openDialog } = useContentAuthDialog();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      openDialog(callbackPath, { redirectOnClose: true });
    }
  }, [callbackPath, loading, user, openDialog]);

  React.useEffect(() => {
    if (!loading && user) {
      router.refresh();
    }
  }, [user, loading, router]);

  return null;
}
