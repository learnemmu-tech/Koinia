"use client";

import Link from "next/link";

import { ImageWithFallback } from "@/components/image-with-fallback";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { siteConfig } from "@/config/site";

export function ChurchBrand() {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild>
          <Link
            href="/"
            onClick={() => {
              if (isMobile) setOpenMobile(false);
            }}
          >
            <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <ImageWithFallback
                src={siteConfig.icon}
                fallback="/images/logo.png"
                alt=""
                aria-hidden
                width={32}
                height={32}
                className="size-8 object-contain"
                priority
              />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{siteConfig.name}</span>
              <span className="truncate text-xs text-sidebar-foreground/70">
                Worship Platform
              </span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
