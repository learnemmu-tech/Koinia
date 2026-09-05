"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AppNavItem, SidebarNavSection } from "@/config/app-sidebar-nav";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
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

function NavBadge({ count, collapsed }: { count: number; collapsed?: boolean }) {
  if (count <= 0) return null;

  if (collapsed) {
    return (
      <span className="absolute right-1 top-0.5 size-2 rounded-full bg-[#FF4444]" />
    );
  }

  return (
    <span className="ml-auto flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[#FF4444] text-[10px] font-semibold leading-none text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

function CollapsedNavLabel({ label }: { label: string }) {
  const presetBreaks: Record<string, [string, string]> = {
    "Content Management": ["Content", "Management"],
    "Prayer Requests": ["Prayer", "Requests"],
    "Church Settings": ["Church", "Settings"],
    "Organization Settings": ["Organization", "Settings"],
  };

  const preset = presetBreaks[label];
  if (preset) {
    return (
      <span className="max-w-[4.5rem] text-center text-[11px] font-medium leading-[1.15]">
        {preset[0]}
        <br />
        {preset[1]}
      </span>
    );
  }

  const words = label.trim().split(/\s+/);
  if (words.length >= 2 && label.length > 11) {
    const mid = Math.ceil(words.length / 2);
    return (
      <span className="max-w-[4.5rem] text-center text-[11px] font-medium leading-[1.15]">
        {words.slice(0, mid).join(" ")}
        <br />
        {words.slice(mid).join(" ")}
      </span>
    );
  }

  return (
    <span className="max-w-[4.5rem] text-center text-[11px] font-medium leading-[1.15]">
      {label}
    </span>
  );
}

const expandedNavLinkClass =
  "flex h-[34px] w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors duration-150";

const collapsedNavLinkClass =
  "relative flex w-full flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1.5 transition-colors duration-150";

export function SidebarNavSections({
  sections,
  showBadges = false,
  className,
}: SidebarNavSectionsProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile, state } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;
  const isSuperAdmin = useIsPlatformSuperAdmin();
  const { user } = useFirebaseAuth();
  const badges = useSidebarAdminBadges();

  function closeMobile() {
    if (isMobile) setOpenMobile(false);
  }

  function resolveBadge(item: AppNavItem): number {
    if (!showBadges || !item.badgeKey) return 0;
    if (item.badgeKey === "pendingPrayers") return badges.pendingPrayers;
    if (item.badgeKey === "pendingMembers") return badges.pendingMembers;
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
              "px-1 py-0",
              isCollapsed ?
                "mt-0.5 first:mt-0"
              : section.label ?
                "mt-5 first:mt-0"
              : "mt-0"
            )}
          >
            {section.label && !isCollapsed ?
              <SidebarGroupLabel className="mb-1.5 h-auto px-3 py-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {section.label}
              </SidebarGroupLabel>
            : null}
            <SidebarMenu className={cn(isCollapsed ? "gap-0.5" : "gap-0.5")}>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.match(pathname);
                const badgeCount = resolveBadge(item);

                return (
                  <SidebarMenuItem key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeMobile}
                      className={cn(
                        isCollapsed ? collapsedNavLinkClass : expandedNavLinkClass,
                        isActive ?
                          isCollapsed ?
                            "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : "border-l-2 border-sidebar-primary bg-sidebar-accent pl-[10px] font-medium text-sidebar-accent-foreground"
                        : isCollapsed ?
                          "text-muted-foreground hover-hover:hover:bg-sidebar-accent hover-hover:hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground"
                        : "border-l-2 border-transparent text-muted-foreground hover-hover:hover:bg-sidebar-accent hover-hover:hover:text-sidebar-accent-foreground active:bg-sidebar-accent",
                        isCollapsed ?
                          "[&>svg]:size-[22px] [&>svg]:shrink-0"
                        : "[&>svg]:size-4 [&>svg]:shrink-0",
                        isActive ? "[&>svg]:text-sidebar-accent-foreground" : "[&>svg]:text-muted-foreground"
                      )}
                    >
                      <Icon />
                      {isCollapsed ?
                        <>
                          <CollapsedNavLabel label={item.label} />
                          <NavBadge count={badgeCount} collapsed />
                        </>
                      : <>
                          <span className="truncate">{item.label}</span>
                          <NavBadge count={badgeCount} />
                        </>
                      }
                    </Link>
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
