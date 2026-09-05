"use client";

import Link from "next/link";
import { ArrowRight, ChevronUp, User } from "lucide-react";

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
import { SidebarFooterNotifications } from "./sidebar-footer-notifications";

const footerIconClass =
  "flex size-7 shrink-0 items-center justify-center rounded-md p-1.5 text-[#6B7280] transition-colors hover:bg-[#1A1A1A] hover:text-white";

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

export function SidebarFooterBar() {
  const { authUser, profile, loading } = useFirebaseAuth();
  const { isMobile, setOpenMobile, state, toggleSidebar } = useSidebar();
  const mounted = useMounted();
  const isCollapsed = state === "collapsed" && !isMobile;

  if (!mounted || loading) {
    return (
      <div
        className={cn(
          "border-t border-[#1F1F1F] bg-transparent",
          isCollapsed ?
            "flex flex-col items-center gap-1 px-1 py-2"
          : "flex h-12 items-center gap-2 px-3 py-2.5"
        )}
      >
        <div className="size-7 animate-pulse rounded-full bg-[#1A1A1A]" />
        {!isCollapsed ?
          <div className="h-3.5 w-24 animate-pulse rounded bg-[#1A1A1A]" />
        : null}
      </div>
    );
  }

  if (!authUser) {
    return (
      <div
        className={cn(
          "border-t border-[#1F1F1F]",
          isCollapsed ?
            "flex flex-col items-center px-1 py-2"
          : "flex h-10 items-center px-2.5"
        )}
      >
        <Link
          href="/signin"
          className={cn(
            "inline-flex items-center rounded-md text-[13px] font-medium text-[#A1A1A1] transition-colors hover:bg-[#1A1A1A] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
      <div className="flex shrink-0 flex-col items-center gap-1 border-t border-[#1F1F1F] bg-transparent px-1 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Open account menu"
              className="flex size-7 items-center justify-center rounded-md outline-none hover:bg-[#1A1A1A]"
            >
              <Avatar className="size-7 shrink-0 rounded-full border border-[#1F1F1F]">
                {authUser.photoURL ?
                  <AvatarImage
                    src={authUser.photoURL}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                  />
                : null}
                <AvatarFallback className="rounded-full bg-[#1A1A1A] text-[11px] font-semibold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
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

        <SidebarFooterNotifications
          userId={authUser.uid}
          onNavigate={() => {
            if (isMobile) setOpenMobile(false);
          }}
        />

        {!isMobile ?
          <SidebarToggleButton isCollapsed={isCollapsed} onToggle={toggleSidebar} />
        : null}
      </div>
    );
  }

  return (
    <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-t border-[#1F1F1F] bg-transparent px-3 py-2.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 text-left outline-none"
          >
            <Avatar className="size-7 shrink-0 rounded-full border border-[#1F1F1F]">
              {authUser.photoURL ?
                <AvatarImage
                  src={authUser.photoURL}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                />
              : null}
              <AvatarFallback className="rounded-full bg-[#1A1A1A] text-[11px] font-semibold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-white">
              {displayName}
            </span>
            <ChevronUp className="size-4 shrink-0 text-[#6B7280]" />
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

      <div className="flex shrink-0 items-center gap-0.5">
        <SidebarFooterNotifications
          userId={authUser.uid}
          onNavigate={() => {
            if (isMobile) setOpenMobile(false);
          }}
        />

        {!isMobile ?
          <SidebarToggleButton isCollapsed={isCollapsed} onToggle={toggleSidebar} />
        : null}
      </div>
    </div>
  );
}

/** @deprecated Use SidebarFooterBar */
export const NavUser = SidebarFooterBar;
