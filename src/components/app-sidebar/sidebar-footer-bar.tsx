"use client";

import Link from "next/link";
import { ArrowRight, ChevronsUpDown, User } from "lucide-react";

import type { AuthUser } from "@/context/firebase-auth-context";
import type { FirestoreUser } from "@/lib/firebase-auth-service";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useMounted } from "@/hooks/use-mounted";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import { AccountMenuItems } from "./account-menu-items";

const footerIconClass =
  "flex size-7 shrink-0 items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover-hover:hover:bg-accent hover-hover:hover:text-foreground active:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

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

function SidebarToggleButton({
  isCollapsed,
  onToggle,
}: {
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      className={footerIconClass}
    >
      <span className="text-base leading-none" aria-hidden>
        {isCollapsed ? "»" : "«"}
      </span>
    </button>
  );
}

function ProfileAvatar({
  authUser,
  displayName,
  initials,
  className,
}: {
  authUser: AuthUser;
  displayName: string;
  initials: string;
  className?: string;
}) {
  return (
    <Avatar className={cn("shrink-0 rounded-md border border-border", className)}>
      {authUser.photoURL ?
        <AvatarImage
          src={authUser.photoURL}
          alt={displayName}
          referrerPolicy="no-referrer"
          className="rounded-md object-cover"
        />
      : null}
      <AvatarFallback className="rounded-md bg-accent text-[11px] font-semibold text-foreground">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

export function SidebarFooterBar() {
  const { authUser, profile, loading } = useFirebaseAuth();
  const { isMobile, state, toggleSidebar } = useSidebar();
  const mounted = useMounted();
  const isCollapsed = state === "collapsed" && !isMobile;

  if (!mounted || loading) {
    return (
      <div
        className={cn(
          "border-t border-border bg-transparent",
          isCollapsed ?
            "flex flex-col items-center gap-1 px-1 py-2"
          : "flex items-center gap-2 px-2 py-2.5"
        )}
      >
        <div className="size-8 animate-pulse rounded-md bg-accent" />
        {!isCollapsed ?
          <div className="h-8 flex-1 animate-pulse rounded bg-accent" />
        : null}
      </div>
    );
  }

  if (!authUser) {
    return (
      <div
        className={cn(
          "border-t border-border",
          isCollapsed ?
            "flex flex-col items-center px-1 py-2"
          : "flex h-10 items-center px-2.5"
        )}
      >
        <Link
          href="/signin"
          className={cn(
            "inline-flex items-center rounded-md text-[13px] font-medium text-muted-foreground transition-colors hover-hover:hover:bg-accent hover-hover:hover:text-foreground active:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isCollapsed ? "size-9 justify-center" : "h-9 gap-2 px-2.5"
          )}
        >
          <User className="size-4 shrink-0" aria-hidden />
          {isCollapsed ?
            <span className="sr-only">Sign in</span>
          : <>
              Sign in
              <ArrowRight className="size-3.5" aria-hidden />
            </>
          }
        </Link>
      </div>
    );
  }

  const displayName = getDisplayName(authUser, profile);
  const initials = getInitials(authUser, profile);

  if (isCollapsed) {
    return (
      <div className="flex shrink-0 flex-col items-center gap-1 border-t border-border bg-transparent px-1 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Open account menu"
              className="flex size-8 items-center justify-center rounded-md outline-none hover:bg-accent"
            >
              <ProfileAvatar
                authUser={authUser}
                displayName={displayName}
                initials={initials}
                className="size-8"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56 rounded-xl">
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

        {!isMobile ?
          <SidebarToggleButton isCollapsed={isCollapsed} onToggle={toggleSidebar} />
        : null}
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1 border-t border-border bg-transparent px-2 py-2.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Open account menu"
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left outline-none transition-colors hover-hover:hover:bg-accent active:bg-accent"
          >
            <ProfileAvatar
              authUser={authUser}
              displayName={displayName}
              initials={initials}
              className="size-8"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold leading-tight text-foreground">
                {displayName}
              </span>
              <span className="block truncate text-xs leading-tight text-muted-foreground">
                {authUser.email}
              </span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" side="top" className="w-56 rounded-xl">
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

      {!isMobile ?
        <SidebarToggleButton isCollapsed={isCollapsed} onToggle={toggleSidebar} />
      : null}
    </div>
  );
}

/** @deprecated Use SidebarFooterBar */
export const NavUser = SidebarFooterBar;
