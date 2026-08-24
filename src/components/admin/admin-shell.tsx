"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowLeft, Menu } from "lucide-react";

import { ADMIN_NAV_ITEMS } from "@/config/admin-nav";
import { siteConfig } from "@/config/site";
import { ChurchSelector } from "@/components/church/church-selector";
import { PlanBadgeFromContext } from "@/components/subscription/plan-badge-from-context";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsPlatformSuperAdmin } from "@/hooks/use-admin-church-id";
import { MULTI_CHURCH_ENABLED } from "@/lib/feature-flags";
import { cn } from "@/lib/utils";

function AdminNavLinks({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const isSuperAdmin = useIsPlatformSuperAdmin();

  const items = ADMIN_NAV_ITEMS.filter(
    (item) => !item.superAdminOnly || isSuperAdmin
  );

  return (
    <nav aria-label="Admin navigation" className={cn("flex flex-col gap-1", className)}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.match(pathname);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
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

export function AdminShell({ children }: { children: ReactNode }) {
  const isSuperAdmin = useIsPlatformSuperAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border/40 bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="size-5" />
              <span className="sr-only">Open admin menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b px-4 py-4 text-left">
              <SheetTitle className="font-heading text-base">
                {siteConfig.name}
              </SheetTitle>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </SheetHeader>
            <div className="p-3">
              <AdminNavLinks onNavigate={() => setMobileOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-sm font-semibold">Admin</p>
        </div>

        {MULTI_CHURCH_ENABLED && isSuperAdmin ? (
          <ChurchSelector compact />
        ) : null}
      </header>

      <div className="mx-auto flex w-full max-w-7xl">
        <aside className="hidden w-60 shrink-0 border-r border-border/40 lg:block">
          <div className="sticky top-0 flex h-screen flex-col">
            <div className="border-b border-border/40 px-4 py-5">
              <Link
                href="/"
                className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" />
                Back to site
              </Link>
              <div className="flex items-center gap-3">
                <Image
                  src={siteConfig.image}
                  alt=""
                  aria-hidden
                  width={32}
                  height={32}
                  className="size-8 rounded-lg object-contain"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-heading text-sm font-semibold">
                      {siteConfig.name}
                    </p>
                    <PlanBadgeFromContext asLink showIcon={false} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Admin Panel</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <AdminNavLinks />
            </div>

            {MULTI_CHURCH_ENABLED && isSuperAdmin ? (
              <div className="border-t border-border/40 p-3">
                <ChurchSelector compact />
              </div>
            ) : null}
          </div>
        </aside>

        <main id="admin-panel-content" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
