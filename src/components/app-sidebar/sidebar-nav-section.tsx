"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

import type { AppNavItem, SidebarNavSection } from "@/config/app-sidebar-nav";
import { isSidebarSectionCollapsible } from "@/config/app-sidebar-nav";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { useNavLabel } from "@/i18n/nav";
import { cn } from "@/lib/utils";

type SidebarNavSectionsProps = {
  sections: SidebarNavSection[];
  showBadges?: boolean;
  className?: string;
  isAuthenticated?: boolean;
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
    "Shepherd AI": ["Shepherd", "AI"],
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
  "flex h-9 w-full items-center gap-2.5 rounded-md border-l-[3px] border-transparent px-3 py-1.5 text-sm transition-colors duration-150 dark:border-l dark:border-transparent";

const collapsedNavLinkClass =
  "relative flex w-full flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1.5 transition-colors duration-150";

const navIdleClass =
  "text-sidebar-foreground/60 [&>svg]:text-sidebar-foreground/50";

const navHoverClass =
  "hover-hover:hover:bg-sidebar-accent hover-hover:hover:text-sidebar-foreground hover-hover:hover:[&>svg]:text-sidebar-foreground dark:hover-hover:hover:bg-transparent dark:hover-hover:hover:text-sidebar-foreground/90 dark:hover-hover:hover:[&>svg]:text-sidebar-foreground/75";

const navActiveExpandedClass =
  "border-l-[3px] border-l-primary bg-card font-medium text-sidebar-foreground shadow-[inset_0_0_0_1px_hsl(var(--border))] [&>svg]:text-sidebar-foreground dark:border-l dark:border-l-sidebar-foreground/25 dark:bg-gradient-to-r dark:from-white/[0.05] dark:to-transparent dark:shadow-[inset_0_1px_0_0_hsl(var(--sidebar-foreground)/0.04)]";

const navActiveCollapsedClass =
  "bg-card font-medium text-sidebar-foreground [&>svg]:text-sidebar-foreground dark:bg-transparent";

const SECTION_STORAGE_PREFIX = "fch.sidebar.section.";

function readStoredOpen(label: string): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(`${SECTION_STORAGE_PREFIX}${label}`);
    if (raw === "1") return true;
    if (raw === "0") return false;
  } catch {
    /* ignore */
  }
  return null;
}

function writeStoredOpen(label: string, open: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      `${SECTION_STORAGE_PREFIX}${label}`,
      open ? "1" : "0"
    );
  } catch {
    /* ignore */
  }
}

function NavItemLink({
  item,
  label,
  isActive,
  isCollapsed,
  badgeCount,
  onNavigate,
}: {
  item: AppNavItem;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  badgeCount: number;
  onNavigate: () => void;
}) {
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          isCollapsed ? collapsedNavLinkClass : expandedNavLinkClass,
          isActive ?
            isCollapsed ? navActiveCollapsedClass : navActiveExpandedClass
          : cn(navIdleClass, navHoverClass),
          isCollapsed ?
            "[&>svg]:size-[22px] [&>svg]:shrink-0"
          : "[&>svg]:size-4 [&>svg]:shrink-0"
        )}
      >
        <Icon />
        {isCollapsed ?
          <>
            <CollapsedNavLabel label={label} />
            <NavBadge count={badgeCount} collapsed />
          </>
        : <>
            <span className="truncate">{label}</span>
            <NavBadge count={badgeCount} />
          </>
        }
      </Link>
    </SidebarMenuItem>
  );
}

function CollapsibleSection({
  section,
  visibleItems,
  isCollapsed,
  showBadges,
  resolveBadge,
  navLabel,
  onNavigate,
}: {
  section: SidebarNavSection;
  visibleItems: AppNavItem[];
  isCollapsed: boolean;
  showBadges: boolean;
  resolveBadge: (item: AppNavItem) => number;
  navLabel: (label: string) => string;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const label = section.label!;
  const hasActiveChild = visibleItems.some((item) => item.match(pathname));
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (hasActiveChild) {
      setOpen(true);
      return;
    }
    const stored = readStoredOpen(label);
    if (stored != null) setOpen(stored);
  }, [hasActiveChild, label, pathname]);

  function handleOpenChange(next: boolean) {
    if (hasActiveChild && !next) {
      // Keep the active route's group discoverable.
      setOpen(true);
      writeStoredOpen(label, true);
      return;
    }
    setOpen(next);
    writeStoredOpen(label, next);
  }

  if (isCollapsed) {
    return (
      <SidebarGroup className="mt-0.5 px-1 py-0 first:mt-0">
        <SidebarMenu className="gap-0.5">
          {visibleItems.map((item) => (
            <NavItemLink
              key={item.href}
              item={item}
              label={navLabel(item.label)}
              isActive={item.match(pathname)}
              isCollapsed
              badgeCount={showBadges ? resolveBadge(item) : 0}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={handleOpenChange} className="mt-3 first:mt-0">
      <SidebarGroup className="px-1 py-0">
        <CollapsibleTrigger
          type="button"
          className={cn(
            "mb-1 flex h-8 w-full items-center justify-between rounded-md px-3 text-left",
            "text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground",
            "transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          )}
          aria-label={`${open ? "Collapse" : "Expand"} ${navLabel(label)}`}
        >
          <span>{navLabel(label)}</span>
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 opacity-70 transition-transform duration-150",
              open ? "rotate-0" : "-rotate-90"
            )}
            aria-hidden
          />
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-none">
          <SidebarMenu className="gap-0.5 pb-0.5">
            {visibleItems.map((item) => (
              <NavItemLink
                key={item.href}
                item={item}
                label={navLabel(item.label)}
                isActive={item.match(pathname)}
                isCollapsed={false}
                badgeCount={showBadges ? resolveBadge(item) : 0}
                onNavigate={onNavigate}
              />
            ))}
          </SidebarMenu>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

export function SidebarNavSections({
  sections,
  showBadges = false,
  className,
  isAuthenticated = false,
}: SidebarNavSectionsProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile, state } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;
  const isSuperAdmin = useIsPlatformSuperAdmin();
  const { user } = useFirebaseAuth();
  const badges = useSidebarAdminBadges();
  const navLabel = useNavLabel();
  const canSeeAuthItems = Boolean(user) || isAuthenticated;

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
          if (item.authOnly && !canSeeAuthItems) return false;
          if (item.superAdminOnly && !isSuperAdmin) return false;
          return true;
        });

        if (visibleItems.length === 0) return null;

        if (isSidebarSectionCollapsible(section)) {
          return (
            <CollapsibleSection
              key={section.label ?? `section-${index}`}
              section={section}
              visibleItems={visibleItems}
              isCollapsed={isCollapsed}
              showBadges={showBadges}
              resolveBadge={resolveBadge}
              navLabel={navLabel}
              onNavigate={closeMobile}
            />
          );
        }

        return (
          <SidebarGroup
            key={section.label ?? `section-${index}`}
            className={cn(
              "px-1 py-0",
              isCollapsed ?
                "mt-0.5 first:mt-0"
              : section.label ?
                "mt-3 first:mt-0"
              : "mt-0"
            )}
          >
            {section.label && !isCollapsed ?
              <SidebarGroupLabel className="mb-1 h-auto px-3 py-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {navLabel(section.label)}
              </SidebarGroupLabel>
            : null}
            <SidebarMenu className="gap-0.5">
              {visibleItems.map((item) => (
                <NavItemLink
                  key={item.href}
                  item={item}
                  label={navLabel(item.label)}
                  isActive={item.match(pathname)}
                  isCollapsed={isCollapsed}
                  badgeCount={showBadges ? resolveBadge(item) : 0}
                  onNavigate={closeMobile}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        );
      })}
    </div>
  );
}
