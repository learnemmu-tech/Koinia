"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { publicHeaderNav } from "@/config/public-nav";
import { siteConfig } from "@/config/site";
import { buildCreateWorkspaceAuthHref } from "@/lib/auth/auth-paths";
import { cn } from "@/lib/utils";

import { PublicWordmark } from "./public-wordmark";

function NavLinks({
  pathname,
  onNavigate,
  className,
}: {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <nav aria-label="Explore" className={className}>
      <ul className="flex flex-col gap-1 md:flex-row md:items-center md:gap-3 lg:gap-5">
        {publicHeaderNav.map((item) => {
          const isActive = item.match(pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "block rounded-md px-1 py-2 text-sm font-medium transition-colors md:px-0 md:py-0",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const getStartedHref = buildCreateWorkspaceAuthHref("/signup");

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:h-16 sm:px-6 md:px-8">
        <PublicWordmark className="shrink-0" />

        <NavLinks
          pathname={pathname}
          className="hidden min-w-0 flex-1 items-center justify-center lg:flex"
        />

        <div className="ml-auto hidden shrink-0 items-center gap-2 lg:flex">
          <Button asChild size="sm" variant="ghost" className="rounded-full">
            <Link href="/signin">Sign In</Link>
          </Button>
          <Button asChild size="sm" className="rounded-full">
            <Link href={getStartedHref}>Get Started</Link>
          </Button>
        </div>

        <div className="ml-auto lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(20rem,100vw)]">
              <SheetHeader>
                <SheetTitle className="text-left">{siteConfig.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <NavLinks
                  pathname={pathname}
                  onNavigate={() => setOpen(false)}
                />
                <div className="flex flex-col gap-2">
                  <Button asChild variant="outline" className="rounded-full">
                    <Link href="/signin" onClick={() => setOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild className="rounded-full">
                    <Link href={getStartedHref} onClick={() => setOpen(false)}>
                      Get Started
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
