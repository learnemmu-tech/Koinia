"use client";

import Link from "next/link";
import { LogOut, Settings2 } from "lucide-react";
import { toast } from "sonner";

import type { AuthUser } from "@/context/firebase-auth-context";
import type { FirestoreUser } from "@/lib/firebase-auth-service";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useChurchManagementAccess } from "@/hooks/use-church-management-access";
import { useAccountMenuActions } from "@/components/app-sidebar/account-menu-items";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

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

export function NavUser() {
  const { authUser, profile, loading } = useFirebaseAuth();
  const { canAccessChurchManagement } = useChurchManagementAccess();
  const { isMobile, setOpenMobile } = useSidebar();
  const { handleSignOut } = useAccountMenuActions();
  const mounted = useMounted();

  if (!mounted || loading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="cursor-default">
            <div className="size-8 animate-pulse rounded-full bg-muted" />
            <div className="grid flex-1 gap-1 group-data-[collapsible=icon]:hidden">
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!authUser) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <Button asChild className="w-full rounded-lg" size="sm">
            <Link href="/signin">Sign in</Link>
          </Button>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const displayName = getDisplayName(authUser, profile);
  const initials = getInitials(authUser, profile);
  const settingsHref =
    canAccessChurchManagement ? "/dashboard/church-settings" : "/settings";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-2 py-1.5",
            "hover:bg-sidebar-accent/60"
          )}
        >
          <Avatar className="size-8 shrink-0 rounded-full border border-sidebar-border/60">
            {authUser.photoURL ?
              <AvatarImage
                src={authUser.photoURL}
                alt={displayName}
                referrerPolicy="no-referrer"
              />
            : null}
            <AvatarFallback className="rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {displayName}
            </p>
            <p className="truncate text-[11px] text-sidebar-foreground/50">
              {authUser.email}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-0.5 group-data-[collapsible=icon]:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-sidebar-foreground/55 hover:text-sidebar-foreground"
              asChild
            >
              <Link
                href={settingsHref}
                aria-label="Settings"
                onClick={() => {
                  if (isMobile) setOpenMobile(false);
                }}
              >
                <Settings2 className="size-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-sidebar-foreground/55 hover:text-destructive"
              aria-label="Sign out"
              onClick={() => {
                if (isMobile) setOpenMobile(false);
                void handleSignOut().catch(() => {
                  toast.error("Failed to sign out.");
                });
              }}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
