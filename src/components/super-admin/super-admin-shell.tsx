"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Menu } from "lucide-react";

import { SuperAdminGlobalSearch } from "@/components/super-admin/super-admin-global-search";
import { SuperAdminNav } from "@/components/super-admin/super-admin-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteConfig } from "@/config/site";
import { SUPER_ADMIN_BASE } from "@/lib/auth/auth-paths";

export function SuperAdminShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border/50 bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="size-5" />
              <span className="sr-only">Open SuperAdmin menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b px-4 py-4 text-left">
              <SheetTitle className="font-heading text-base">
                {siteConfig.name}
              </SheetTitle>
              <p className="text-xs text-muted-foreground">Platform console</p>
            </SheetHeader>
            <div className="p-3">
              <SuperAdminNav onNavigate={() => setMobileOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-sm font-semibold">
            Platform console
          </p>
        </div>
        <SuperAdminGlobalSearch />
      </header>

      <div className="mx-auto flex w-full max-w-[1400px]">
        <aside className="hidden w-56 shrink-0 border-r border-border/50 lg:block xl:w-60">
          <div className="sticky top-0 flex h-svh flex-col">
            <div className="border-b border-border/50 px-4 py-4">
              <Link
                href="/"
                className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" />
                Back to site
              </Link>
              <Link href={SUPER_ADMIN_BASE} className="flex items-center gap-3">
                <Image
                  src={siteConfig.image}
                  alt=""
                  aria-hidden
                  width={32}
                  height={32}
                  className="size-8 rounded-lg object-contain"
                />
                <div className="min-w-0">
                  <p className="truncate font-heading text-sm font-semibold">
                    {siteConfig.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Platform console
                  </p>
                </div>
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <SuperAdminNav />
            </div>
          </div>
        </aside>

        <main
          id="super-admin-content"
          className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-7"
        >
          <div className="mb-6 hidden lg:block">
            <SuperAdminGlobalSearch className="ml-auto flex justify-end" />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
