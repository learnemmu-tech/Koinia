"use client";

import Link from "next/link";

import { ImageWithFallback } from "@/components/image-with-fallback";
import { useSidebar } from "@/components/ui/sidebar";
import { siteConfig } from "@/config/site";

export function ChurchBrand() {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Link
      href="/"
      onClick={() => {
        if (isMobile) setOpenMobile(false);
      }}
      className="flex min-w-0 items-center gap-2.5"
    >
      <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-card">
        <ImageWithFallback
          src={siteConfig.icon}
          fallback="/images/logo.png"
          alt=""
          aria-hidden
          width={32}
          height={32}
          className="size-7 object-contain"
          priority
        />
      </div>
      <span className="truncate text-sm font-semibold text-sidebar-foreground">
        {siteConfig.name}
      </span>
    </Link>
  );
}
