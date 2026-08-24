"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AppNavItem, SidebarNavSection } from "@/config/app-sidebar-nav";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useIsPlatformSuperAdmin } from "@/hooks/use-admin-church-id";
import { useSidebarAdminBadges } from "@/hooks/use-sidebar-admin-badges";
import { cn } from "@/lib/utils";

type SidebarNavSectionsProps = {
  sections: SidebarNavSection[];
  showBadges?: boolean;
  className?: string;
};

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="ml-auto flex size-[18px] shrink-0 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold leading-none text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function SidebarNavSections({
  sections,
  showBadges = false,
  className,
}: SidebarNavSectionsProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const isSuperAdmin = useIsPlatformSuperAdmin();
  const { user } = useFirebaseAuth();
  const badges = useSidebarAdminBadges();

  function closeMobile() {
    if (isMobile) setOpenMobile(false);
  }

  function resolveBadge(item: AppNavItem): number {
    if (!showBadges || !item.badgeKey) return 0;
    if (item.badgeKey === "pendingPrayers") return badges.pendingPrayers;
    if (item.badgeKey === "pendingContent") return badges.pendingContent;
    return 0;
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {sections.map((section, index) => {
        const visibleItems = section.items.filter((item) => {
          if (item.authOnly && !user) return false;
          if (item.superAdminOnly && !isSuperAdmin) return false;
          return true;
        });

        if (visibleItems.length === 0) return null;

        return (
          <SidebarGroup
            key={section.label ?? `section-${index}`}
            className={cn(
              "px-2 py-0",
              section.label ? "mt-5 first:mt-0" : "mt-0"
            )}
          >
            {section.label ?
              <SidebarGroupLabel className="mb-1 h-auto px-3 py-0 text-[10px] font-medium uppercase tracking-[0.1em] text-sidebar-foreground/40">
                {section.label}
              </SidebarGroupLabel>
            : null}
            <SidebarMenu className="gap-0.5">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.match(pathname);
                const badgeCount = resolveBadge(item);

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
                      <Link href={item.href} onClick={closeMobile}>
                        <Icon />
                        <span className="truncate text-sm">{item.label}</span>
                        <NavBadge count={badgeCount} />
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        );
      })}
    </div>
  );
}
