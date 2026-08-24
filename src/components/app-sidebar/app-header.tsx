"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { NotificationBell } from "@/components/notifications/notification-bell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useMounted } from "@/hooks/use-mounted";

type AppHeaderProps = {
  search: ReactNode;
};

export function AppHeader({ search }: AppHeaderProps) {
  const { authUser, loading } = useFirebaseAuth();
  const mounted = useMounted();

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-border/40 bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-5" />

      {/* Center — search */}
      <div className="flex flex-1 justify-center">
        <div className="w-full max-w-xl">{search}</div>
      </div>

      {/* Right — notifications */}
      <div className="flex shrink-0 items-center gap-1">
        {!mounted || loading ? (
          <div className="size-9" />
        ) : authUser ? (
          <NotificationBell userId={authUser.uid} />
        ) : (
          <Button asChild size="sm" variant="outline">
            <Link href="/signin">Sign In</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
