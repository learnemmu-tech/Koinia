"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { siteConfig } from "@/config/site";

export function OnboardingFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const websitePicker = pathname === "/onboarding/website";

  if (!websitePicker) {
    return (
      <div className="relative flex min-h-svh flex-col bg-gradient-to-b from-background via-background to-muted/30">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"
          aria-hidden
        />
        <header className="relative z-10 flex shrink-0 justify-center px-6 py-5 sm:py-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src={siteConfig.icon} alt="" width={36} height={36} className="rounded-lg" />
            <span className="font-heading text-lg font-semibold tracking-tight">{siteConfig.name}</span>
          </Link>
        </header>
        <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-4 pb-16 pt-2 sm:px-6">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="flex items-center px-4 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src={siteConfig.icon} alt="" width={36} height={36} className="rounded-lg" />
          <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
            {siteConfig.name}
          </span>
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-16 pt-4 sm:px-8">
        {children}
      </main>
    </div>
  );
}
