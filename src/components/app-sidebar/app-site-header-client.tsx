"use client";

import { usePathname } from "next/navigation";

import { NotificationBell } from "@/components/notifications/notification-bell";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useMounted } from "@/hooks/use-mounted";
import { isMembershipStatusPath } from "@/lib/auth/auth-paths";

import { HeaderUserMenu } from "./header-user-menu";

export function AppSiteHeaderClient() {
  const { authUser, loading } = useFirebaseAuth();
  const { isMobile } = useSidebar();
  const mounted = useMounted();
  const pathname = usePathname();

  if (isMembershipStatusPath(pathname)) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 min-w-0 shrink-0 items-center gap-2 border-b border-border/40 bg-background/80 px-2 backdrop-blur-[8px] supports-[backdrop-filter]:bg-background/80 sm:gap-3 sm:px-4">
      {isMobile ?
        <SidebarTrigger className="-ml-0.5 shrink-0 sm:-ml-1" />
      : null}

      <div className="min-w-0 flex-1" aria-hidden />

      <div className="flex shrink-0 items-center gap-1">
        {!mounted || loading ?
          <div className="size-9" />
        : authUser ?
          <NotificationBell userId={authUser.uid} />
        : null}
        <HeaderUserMenu />
      </div>
    </header>
  );
}
