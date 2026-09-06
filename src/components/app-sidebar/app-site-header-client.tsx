"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

import { NotificationBell } from "@/components/notifications/notification-bell";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useMounted } from "@/hooks/use-mounted";
import { isMembershipStatusPath } from "@/lib/auth/auth-paths";

export function AppSiteHeaderClient() {
  const { authUser, loading } = useFirebaseAuth();
  const mounted = useMounted();
  const pathname = usePathname();

  if (isMembershipStatusPath(pathname)) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 min-w-0 shrink-0 items-center gap-2 border-b border-border/60 bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/90 sm:px-4">
      <SidebarTrigger className="-ml-0.5 shrink-0" />

      <div className="min-w-0 flex-1" aria-hidden />

      <div className="flex shrink-0 items-center gap-2">
        {!mounted || loading ?
          <div className="size-10" />
        : authUser ?
          <NotificationBell userId={authUser.uid} />
        : <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link href="/signin">Sign In</Link>
          </Button>
        }
      </div>
    </header>
  );
}
