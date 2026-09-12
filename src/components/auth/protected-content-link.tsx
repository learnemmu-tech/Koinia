"use client";

import Link from "next/link";
import React from "react";

import { useContentAuthDialogOptional } from "@/context/content-auth-dialog-context";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { cn } from "@/lib/utils";

type ProtectedContentLinkProps = {
  href: string;
  className?: string;
  children: React.ReactNode;
  /** When true, opens the auth dialog instead of navigating for signed-out visitors. */
  requireAuth?: boolean;
  onClick?: React.MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
  "aria-label"?: string;
};

/**
 * Navigates to content when public or authenticated; opens the auth dialog when
 * `requireAuth` is set and the visitor is signed out.
 */
export function ProtectedContentLink({
  href,
  className,
  children,
  requireAuth = false,
  onClick,
  "aria-label": ariaLabel,
}: ProtectedContentLinkProps) {
  const { user, loading } = useFirebaseAuth();
  const dialog = useContentAuthDialogOptional();

  if (!requireAuth || (!loading && user) || !dialog) {
    return (
      <Link
        href={href}
        className={className}
        aria-label={ariaLabel}
        onClick={onClick}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cn("cursor-pointer text-left", className)}
      onClick={(event) => {
        onClick?.(event);
        dialog.openDialog(href, { redirectOnClose: false });
      }}
      disabled={loading}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
