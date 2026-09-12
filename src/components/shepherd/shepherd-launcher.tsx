"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ShepherdPulseMark } from "@/components/shepherd/shepherd-pulse-mark";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { usePlayerVisible } from "@/hooks/use-player-visible";
import { cn } from "@/lib/utils";

/**
 * Single global Shepherd AI entry control.
 * Portaled to document.body so `position: fixed` is always viewport-relative
 * (not trapped by SidebarInset / overflow ancestors).
 */
export function ShepherdLauncher() {
  const { user, loading } = useFirebaseAuth();
  const pathname = usePathname();
  const showPlayer = usePlayerVisible();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (loading || !user) return null;
  if (pathname === "/shepherd" || pathname.startsWith("/shepherd/")) return null;
  if (!mounted) return null;

  const launcher = (
    <Link
      href="/shepherd"
      aria-label="Open Shepherd AI"
      className={cn(
        "shepherd-launcher shepherd-theme group fixed z-40",
        // Mobile: true bottom-right of the viewport (+ safe area).
        // Only lift when the global audio player is actually visible.
        showPlayer ?
          "bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-4 sm:bottom-[calc(6.25rem+env(safe-area-inset-bottom,0px))] sm:right-6"
        : "bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] right-4 sm:bottom-6 sm:right-6",
        "inline-flex items-center gap-2.5 rounded-full",
        "border border-border/80 bg-background/95 px-3.5 py-2.5",
        "text-foreground shadow-[0_8px_28px_-8px_rgba(0,0,0,0.28)]",
        "backdrop-blur-md transition-[transform,box-shadow,border-color,background-color,bottom] duration-200",
        "hover:-translate-y-0.5 hover:border-primary/35 hover:bg-background",
        "hover:shadow-[0_12px_32px_-10px_rgba(0,0,0,0.32)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "active:translate-y-0"
      )}
    >
      <ShepherdPulseMark size="sm" />

      <span
        className={cn(
          "hidden pr-1 sm:inline",
          "font-heading text-[0.95rem] font-semibold tracking-[-0.01em]",
          "leading-none text-foreground"
        )}
      >
        Shepherd&nbsp;AI
      </span>
    </Link>
  );

  return createPortal(launcher, document.body);
}
