"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  Cog,
  HeartHandshake,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Mic2,
  Monitor,
  Moon,
  Music,
  Shield,
  Sparkles,
  Sun,
  User2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import type { LucideIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useMounted } from "@/hooks/use-mounted";
import type { AuthUser } from "@/context/firebase-auth-context";
import type { FirestoreUser } from "@/lib/firebase-auth-service";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
};

const MOBILE_NAV: NavItem[] = [
  { label: "Home", href: "/", icon: Home, match: (p) => p === "/" },
  {
    label: "Songs",
    href: "/songs",
    icon: Music,
    match: (p) => p === "/songs" || p.startsWith("/songs/"),
  },
  {
    label: "Sermons",
    href: "/sermons",
    icon: Mic2,
    match: (p) => p === "/sermons" || p.startsWith("/sermons/"),
  },
  {
    label: "Articles",
    href: "/articles",
    icon: BookOpen,
    match: (p) => p === "/articles" || p.startsWith("/articles/"),
  },
  {
    label: "Prayer Requests",
    href: "/prayer-requests",
    icon: Sparkles,
    match: (p) => p.startsWith("/prayer-requests"),
  },
  {
    label: "Events",
    href: "/events",
    icon: CalendarDays,
    match: (p) => p.startsWith("/events"),
  },
  {
    label: "Donations",
    href: "/donations",
    icon: HeartHandshake,
    match: (p) => p.startsWith("/donations"),
  },
];

const THEME_OPTIONS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function getInitials(authUser: AuthUser, profile: FirestoreUser | null): string {
  if (profile?.firstName && profile?.lastName) {
    return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
  }
  if (authUser.displayName) {
    const parts = authUser.displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
    }
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

const navRowClassName =
  "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors";

function NavRow({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
}) {
  return (
    <SheetClose asChild>
      <Link
        href={href}
        className={cn(
          navRowClassName,
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        <Icon className="size-[18px] shrink-0" aria-hidden />
        {label}
      </Link>
    </SheetClose>
  );
}

export function MobileHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { authUser, profile, isAdmin, loading, signOut } = useFirebaseAuth();
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    setOpen(false);
    try {
      await signOut();
      toast.success("Signed out successfully.");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to sign out.");
    }
  }

  const displayName = authUser ? getDisplayName(authUser, profile) : "";
  const initials = authUser ? getInitials(authUser, profile) : "U";

  const headerShell = (
    <div className="relative flex h-14 items-center justify-between px-1.5">
      <div className="flex w-24 justify-start">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          className="size-11 text-muted-foreground hover:text-foreground"
          disabled={!mounted}
          onClick={mounted ? () => setOpen(true) : undefined}
        >
          <Menu className="size-5" aria-hidden />
        </Button>
      </div>

      <Link
        href="/"
        aria-label={`${siteConfig.name} home`}
        className="absolute left-1/2 -translate-x-1/2 font-heading text-base font-bold tracking-tight text-foreground"
      >
        {siteConfig.name}
      </Link>

      <div className="flex w-24 items-center justify-end gap-0.5">
        {!mounted || loading ?
          <div className="size-9 animate-pulse rounded-full bg-muted" />
        : authUser ?
          <>
            <NotificationBell userId={authUser.uid} />
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="flex size-11 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Avatar className="size-8 border shadow-sm">
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
            </button>
          </>
        : <Button asChild size="sm" variant="outline" className="h-9">
            <Link href="/signin">Sign In</Link>
          </Button>
        }
      </div>
    </div>
  );

  if (!mounted) {
    return headerShell;
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {headerShell}

      <SheetContent
        side="left"
        className="flex w-[300px] max-w-[85vw] flex-col gap-0 p-0"
      >
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>

        {/* Brand / identity header */}
        {authUser ? (
          <div className="flex items-center gap-3 border-b border-border/50 px-5 py-4">
            <Avatar className="size-10 border">
              {authUser.photoURL ? (
                <AvatarImage
                  src={authUser.photoURL}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {displayName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {authUser.email}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-14 items-center border-b border-border/50 px-5">
            <span className="font-heading text-lg font-bold tracking-tight text-foreground">
              {siteConfig.name}
            </span>
          </div>
        )}

        {/* Scrollable nav */}
        <nav
          aria-label="Mobile navigation"
          className="flex-1 overflow-y-auto px-2 py-3"
        >
          <div className="space-y-0.5">
            {MOBILE_NAV.map((item) => (
              <NavRow
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={item.match(pathname)}
              />
            ))}
          </div>

          <Separator className="my-3 bg-border/50" />

          {authUser ? (
            <div className="space-y-0.5">
              <NavRow
                href="/profile"
                label="Profile"
                icon={User2}
                active={
                  pathname.startsWith("/profile") &&
                  !pathname.startsWith("/profile/dashboard")
                }
              />
              <NavRow
                href="/profile/dashboard"
                label="My Dashboard"
                icon={LayoutDashboard}
                active={pathname.startsWith("/profile/dashboard")}
              />
              <NavRow
                href="/favorites"
                label="My Favorites"
                icon={HeartHandshake}
                active={pathname.startsWith("/favorites")}
              />
              <NavRow
                href="/settings"
                label="Settings"
                icon={Cog}
                active={pathname.startsWith("/settings")}
              />
              {isAdmin ? (
                <NavRow
                  href="/admin-panel"
                  label="Admin Panel"
                  icon={Shield}
                  active={pathname.startsWith("/admin-panel")}
                />
              ) : null}
            </div>
          ) : (
            <NavRow href="/signin" label="Sign In" icon={User2} />
          )}

          <Separator className="my-3 bg-border/50" />

          {/* Theme */}
          <div className="px-1">
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
              Theme
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {THEME_OPTIONS.map((option) => {
                const isActive = mounted && theme === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      "flex h-11 flex-col items-center justify-center gap-1 rounded-lg border text-[11px] font-medium transition-colors",
                      isActive
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <option.icon className="size-4" aria-hidden />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Footer — logout */}
        {authUser ? (
          <div className="border-t border-border/50 p-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleSignOut}
              className="h-11 w-full justify-start gap-3 px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <LogOut className="size-[18px]" aria-hidden />
              Logout
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
