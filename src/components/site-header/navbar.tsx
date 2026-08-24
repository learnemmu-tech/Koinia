import { ImageWithFallback } from "@/components/image-with-fallback";
import Link from "next/link";

import { ChurchSelector } from "@/components/church/church-selector";
import { siteConfig } from "@/config/site";
import { AuthNav } from "../site-header/auth-nav";
import { DesktopPrimaryNav } from "../site-header/header-nav";
import { MobileHeader } from "../site-header/mobile-header";

export async function Navbar() {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      suppressHydrationWarning
    >
      {/* ── Desktop / tablet — single row ── */}
      <div className="mx-auto hidden h-16 w-full max-w-7xl items-center px-4 sm:px-6 md:flex md:px-8">
        {/* Logo — hard left */}
        <Link
          href="/"
          aria-label={`${siteConfig.name} home`}
          className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-75"
        >
          <ImageWithFallback
            src={siteConfig.icon}
            fallback="/images/logo.png"
            alt=""
            aria-hidden
            width={30}
            height={30}
            className="size-7 shrink-0 rounded-md object-contain"
            priority
          />
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-tight text-foreground">
              {siteConfig.name}
            </span>
            <span className="text-[10px] text-muted-foreground/50">
              Christian Worship Platform
            </span>
          </div>
        </Link>

        {/* Desktop nav — immediately after logo */}
        <DesktopPrimaryNav className="ml-6 flex" />

        {/* Spacer pushes everything right */}
        <div className="flex-1" />

        <ChurchSelector className="ml-2 hidden lg:flex" />

        {/* Auth — hard right */}
        <div className="ml-3 flex shrink-0 items-center gap-1.5">
          <AuthNav />
        </div>
      </div>

      {/* ── Mobile — two rows ── */}
      <div className="flex flex-col md:hidden">
        {/* Row 1 — hamburger / brand / notifications + avatar */}
        <MobileHeader />
      </div>
    </header>
  );
}
