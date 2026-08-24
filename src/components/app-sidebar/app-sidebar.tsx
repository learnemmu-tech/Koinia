"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

import { SidebarNavigation } from "./sidebar-navigation";

function SidebarNavFallback() {
  return null;
}

export function AppSidebar() {
  return (
    <Sidebar
      collapsible="offcanvas"
      className={cn(
        "border-r border-sidebar-border/60 bg-sidebar/95",
        "[--sidebar-width:15rem]"
      )}
    >
      <SidebarHeader className="border-b border-sidebar-border/40 px-3 py-3">
        <Link href="/" className="flex items-center gap-2.5 px-1">
          <Image
            src={siteConfig.icon}
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-lg"
          />
          <div className="min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">
              {siteConfig.name}
            </p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden px-1 pt-2">
        <Suspense fallback={<SidebarNavFallback />}>
          <SidebarNavigation />
        </Suspense>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
