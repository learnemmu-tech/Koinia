"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { getChurchManagementNavItems } from "@/lib/organization/church-management-nav";
import {
  CHURCH_MANAGEMENT_GROUP_ICON,
  CHURCH_MANAGEMENT_GROUP_LABEL,
  isChurchManagementPath,
} from "@/config/church-management-nav";
import { useOrganizationOptional } from "@/context/organization-context";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "sidebar_church_management_open";

export function NavChurchManagement() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isMobile, setOpenMobile } = useSidebar();
  const GroupIcon = CHURCH_MANAGEMENT_GROUP_ICON;

  const [open, setOpen] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "false") setOpen(false);
      else if (stored === "true") setOpen(true);
      else if (isChurchManagementPath(pathname)) setOpen(true);
    } catch {
      // ignore
    }
    setHydrated(true);
  }, [pathname]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, String(open));
    } catch {
      // ignore
    }
  }, [open, hydrated]);

  useEffect(() => {
    if (isChurchManagementPath(pathname)) {
      setOpen(true);
    }
  }, [pathname]);

  const organization = useOrganizationOptional()?.organization;
  const navItems = getChurchManagementNavItems(organization);

  const groupActive = navItems.some((item) =>
    item.match(pathname, searchParams)
  );

  function closeMobile() {
    if (isMobile) setOpenMobile(false);
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={CHURCH_MANAGEMENT_GROUP_LABEL}
            isActive={groupActive}
            className="font-medium"
          >
            <GroupIcon />
            <span>{CHURCH_MANAGEMENT_GROUP_LABEL}</span>
            <ChevronRight
              className={cn(
                "ml-auto size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                open && "rotate-90"
              )}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <SidebarMenuSub>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.match(pathname, searchParams);

              return (
                <SidebarMenuSubItem key={item.href}>
                  <SidebarMenuSubButton asChild isActive={isActive}>
                    <Link href={item.href} onClick={closeMobile}>
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
