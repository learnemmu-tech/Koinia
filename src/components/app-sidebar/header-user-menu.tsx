"use client";

import Link from "next/link";

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

export function HeaderUserMenu() {
  const { authUser, profile, loading } = useFirebaseAuth();
  const mounted = useMounted();

  if (!mounted || loading) {
    return <div className="size-9 shrink-0 rounded-full bg-muted/60" />;
  }

  if (!authUser) {
    return (
      <Button asChild size="sm" variant="outline" className="rounded-full">
        <Link href="/signin">Sign In</Link>
      </Button>
    );
  }

  const displayName = getDisplayName(authUser, profile);
  const initials = getInitials(authUser, profile);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-full"
          aria-label="Open account menu"
        >
          <Avatar className="size-8 border">
            {authUser.photoURL ?
              <AvatarImage
                src={authUser.photoURL}
                alt={displayName}
                referrerPolicy="no-referrer"
              />
            : null}
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <span className="truncate text-sm font-medium">{displayName}</span>
            <span className="truncate text-xs text-muted-foreground">
              {authUser.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <AccountMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
