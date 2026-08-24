"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AppNavItem } from "@/config/app-sidebar-nav";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type SidebarFooterNavProps = {
  items: AppNavItem[];
  className?: string;
};

export function SidebarFooterNav({ items, className }: SidebarFooterNavProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <div className={cn("border-t border-sidebar-border/50 px-2 py-2", className)}>
      <SidebarMenu className="gap-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.match(pathname);

          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={item.label}
                className={cn(
                  "h-9 rounded-md px-3 py-2 transition-colors duration-150",
                  "hover:bg-white/5",
                  "data-[active=true]:bg-white/10 data-[active=true]:text-sidebar-foreground",
                  "[&>svg]:size-4 [&>svg]:shrink-0",
                  "data-[active=false]:[&>svg]:text-sidebar-foreground/50",
                  "data-[active=true]:[&>svg]:text-sidebar-foreground"
                )}
              >
                <Link
                  href={item.href}
                  onClick={() => {
                    if (isMobile) setOpenMobile(false);
                  }}
                >
                  <Icon />
                  <span className="truncate text-sm">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </div>
  );
}
