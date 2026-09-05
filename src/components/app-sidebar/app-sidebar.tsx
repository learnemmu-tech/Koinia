"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { isMembershipStatusPath } from "@/lib/auth/auth-paths";

import { SidebarWorkspaceHeader } from "./church-switcher-card";
import { SidebarFooterBar } from "./sidebar-footer-bar";
import { SidebarNavigation } from "./sidebar-navigation";

function SidebarNavFallback() {
  return null;
}

export function AppSidebar() {
  const pathname = usePathname();

  if (isMembershipStatusPath(pathname)) {
    return null;
  }

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar"
    >
      <SidebarHeader className="shrink-0 border-b border-sidebar-border px-2 py-2.5 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-2">
        <SidebarWorkspaceHeader />
      </SidebarHeader>

      <SidebarContent className="sidebar-scroll min-h-0 flex-1 overflow-y-auto px-1 py-1 group-data-[collapsible=icon]:px-0.5">
        <Suspense fallback={<SidebarNavFallback />}>
          <SidebarNavigation />
        </Suspense>
      </SidebarContent>

      <SidebarFooter className="shrink-0 p-0">
        <SidebarFooterBar />
      </SidebarFooter>
    </Sidebar>
  );
}
