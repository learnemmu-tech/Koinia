"use client";

import Link from "next/link";
import React from "react";

import { useContentAuthDialog } from "@/context/content-auth-dialog-context";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { cn } from "@/lib/utils";

type ProtectedContentLinkProps = {
  href: string;
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
};

/**
 * Navigates to content when authenticated; opens the auth dialog when not.
 */
export function ProtectedContentLink({
  href,
  className,
  children,
  "aria-label": ariaLabel,
}: ProtectedContentLinkProps) {
  const { user, loading } = useFirebaseAuth();
  const { openDialog } = useContentAuthDialog();

  if (!loading && user) {
    return (
      <Link href={href} className={className} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cn("cursor-pointer text-left", className)}
      onClick={() => openDialog(href, { redirectOnClose: false })}
      disabled={loading}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
