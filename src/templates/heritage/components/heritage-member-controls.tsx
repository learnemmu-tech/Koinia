"use client";

import { HeaderUserMenu } from "@/components/app-sidebar/header-user-menu";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { persistActiveChurchCookie } from "@/lib/church-cookies";
import { cn } from "@/lib/utils";
import { HeritageActiveChurchSync } from "@/templates/heritage/components/heritage-member-app-redirect";

const heritageLocaleClass = cn(
  "heritage-header-locale",
  "min-h-0 border-transparent bg-transparent px-2.5 text-current shadow-none",
  "hover:bg-transparent hover:text-current",
  "focus-visible:ring-0 focus-visible:ring-offset-0"
);

const heritageBellClass = cn(
  "heritage-header-bell",
  "border-[var(--heritage-border)] bg-transparent text-current shadow-none",
  "hover-hover:hover:bg-transparent"
);

export function HeritageLocaleControl({
  className,
  align = "end",
}: {
  className?: string;
  align?: "start" | "center" | "end";
}) {
  return (
    <LocaleSwitcher
      display="code"
      align={align}
      className={cn(heritageLocaleClass, className)}
    />
  );
}

export function HeritageMemberControls({
  churchId,
  onNavigate,
}: {
  churchId: string;
  churchSlug: string;
  onNavigate?: () => void;
}) {
  const { authUser } = useFirebaseAuth();

  return (
    <div className="flex h-full items-center gap-1.5">
      <HeritageActiveChurchSync churchId={churchId} />
      <HeritageLocaleControl />
      {authUser ? (
        <NotificationBell userId={authUser.uid} className={heritageBellClass} />
      ) : null}
      <HeaderUserMenu
        variant="heritage"
        guestFallback="skeleton"
        onNavigate={() => {
          persistActiveChurchCookie(churchId);
          onNavigate?.();
        }}
      />
    </div>
  );
}
