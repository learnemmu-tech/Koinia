"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import type { AppNavItem } from "@/config/app-sidebar-nav";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

import { NavChurchManagement } from "./nav-church-management";
import { WorkspaceTenantSwitcher } from "./workspace-tenant-switcher";

type NavWorkspaceSectionProps = {
  items: AppNavItem[];
  showChurchManagement: boolean;
};

export function NavWorkspaceSection({
  items,
  showChurchManagement,
}: NavWorkspaceSectionProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isMobile, setOpenMobile } = useSidebar();

  if (items.length === 0 && !showChurchManagement) return null;

  function closeMobile() {
    if (isMobile) setOpenMobile(false);
  }

  function isItemActive(item: AppNavItem): boolean {
    if (item.label === "Members") {
      if (pathname.startsWith("/dashboard/users")) return true;
      return (
        pathname.startsWith("/dashboard/organization") &&
        searchParams.get("tab") === "members"
      );
    }
    return item.match(pathname);
  }

  return (
    <>
      <SidebarSeparator className="my-1.5" />
      <WorkspaceTenantSwitcher />
      <SidebarGroup className="px-2 py-0.5">
        <SidebarGroupLabel className="h-7 px-2 text-[11px]">
          Workspace
        </SidebarGroupLabel>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isItemActive(item)}
                  tooltip={item.label}
                >
                  <Link href={item.href} onClick={closeMobile}>
                    <Icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
          {showChurchManagement ? <NavChurchManagement /> : null}
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
