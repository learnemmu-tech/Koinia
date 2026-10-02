"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import type { AuthUser } from "@/context/firebase-auth-context";
import type { FirestoreUser } from "@/lib/firebase-auth-service";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

import { AccountMenuItems } from "./account-menu-items";

function getInitials(authUser: AuthUser, profile: FirestoreUser | null): string {
  if (profile?.firstName && profile?.lastName) {
    return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
  }
  if (authUser.displayName) {
    const parts = authUser.displayName.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
    return parts[0]?.[0]?.toUpperCase() ?? "U";
  }
  return authUser.email?.[0]?.toUpperCase() ?? "U";
}

function getDisplayName(
  authUser: AuthUser,
  profile: FirestoreUser | null
): string {
  if (profile?.firstName || profile?.lastName) {
    return `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim();
  }
  return authUser.displayName ?? "User";
}

type HeaderUserMenuProps = {
  variant?: "default" | "heritage";
  guestFallback?: "signin" | "skeleton";
  onNavigate?: () => void;
};

export function HeaderUserMenu({
  variant = "default",
  guestFallback = "signin",
  onNavigate,
}: HeaderUserMenuProps) {
  const tCommon = useTranslations("common");
  const tNav = useTranslations("navigation");
  const { authUser, profile, loading } = useFirebaseAuth();
  const mounted = useMounted();
  const heritage = variant === "heritage";

  if (!mounted || loading) {
    return (
      <div
        className={cn(
          "size-9 shrink-0 rounded-full",
          heritage
            ? "bg-[var(--heritage-muted-bg)]"
            : "bg-muted/60"
        )}
      />
    );
  }

  if (!authUser) {
    if (guestFallback === "skeleton") {
      return (
        <div
          className={cn(
            "size-9 shrink-0 rounded-full",
            heritage
              ? "bg-[var(--heritage-muted-bg)]"
              : "bg-muted/60"
          )}
        />
      );
    }
    return (
      <Button asChild size="sm" variant="outline" className="rounded-full">
        <Link href="/signin">{tCommon("signIn")}</Link>
      </Button>
    );
  }

  const displayName = getDisplayName(authUser, profile);
  const initials = getInitials(authUser, profile);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={
            heritage
              ? "heritage-header-user size-9 min-h-0 rounded-full p-0 text-current hover:bg-transparent hover:text-current focus-visible:ring-0 focus-visible:ring-offset-0"
              : "size-9 rounded-full"
          }
          aria-label={tNav("openAccountMenu")}
        >
          <Avatar
            className={cn(
              "size-8 border",
              heritage && "border-[var(--heritage-border)]"
            )}
          >
            {authUser.photoURL ?
              <AvatarImage
                src={authUser.photoURL}
                alt={displayName}
                referrerPolicy="no-referrer"
              />
            : null}
            <AvatarFallback
              className={
                heritage
                  ? "bg-[var(--heritage-primary)] text-xs font-semibold text-[var(--heritage-primary-foreground)]"
                  : "bg-primary/10 text-xs font-semibold text-primary"
              }
            >
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        collisionPadding={8}
        className="w-56 rounded-xl"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <span className="truncate text-sm font-medium">{displayName}</span>
            <span className="truncate text-xs text-muted-foreground">
              {authUser.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <AccountMenuItems onNavigate={onNavigate} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
