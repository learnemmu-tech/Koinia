"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Church,
  CreditCard,
  LayoutDashboard,
  LibraryBig,
  Users,
} from "lucide-react";

import { SUPER_ADMIN_BASE } from "@/lib/auth/auth-paths";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  match: (pathname: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: SUPER_ADMIN_BASE,
    label: "Overview",
    icon: LayoutDashboard,
    match: (pathname) => pathname === SUPER_ADMIN_BASE,
  },
  {
    href: `${SUPER_ADMIN_BASE}/content`,
    label: "Platform Content",
    icon: LibraryBig,
    match: (pathname) => pathname.startsWith(`${SUPER_ADMIN_BASE}/content`),
  },
  {
    href: `${SUPER_ADMIN_BASE}/organizations`,
    label: "Organizations",
    icon: Building2,
    match: (pathname) =>
      pathname.startsWith(`${SUPER_ADMIN_BASE}/organizations`),
  },
  {
    href: `${SUPER_ADMIN_BASE}/churches`,
    label: "Churches",
    icon: Church,
    match: (pathname) => pathname.startsWith(`${SUPER_ADMIN_BASE}/churches`),
  },
  {
    href: `${SUPER_ADMIN_BASE}/members`,
    label: "Members",
    icon: Users,
    match: (pathname) => pathname.startsWith(`${SUPER_ADMIN_BASE}/members`),
  },
  {
    href: `${SUPER_ADMIN_BASE}/subscriptions`,
    label: "Subscriptions",
    icon: CreditCard,
    match: (pathname) =>
      pathname.startsWith(`${SUPER_ADMIN_BASE}/subscriptions`),
  },
];

export function SuperAdminNav({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="SuperAdmin navigation"
      className={cn("flex flex-col gap-0.5", className)}
    >
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Platform
      </p>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.match(pathname);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-md border-l-2 border-transparent px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-primary/70 bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
