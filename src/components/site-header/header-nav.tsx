"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { useMounted } from "@/hooks/use-mounted";
import type { SiteNavItem } from "@/config/site-nav";
import {
  siteMinistryNav,
  siteMinistrySecondaryNav,
  sitePrimaryNav,
} from "@/config/site-nav";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const MINISTRY_LABEL = "Ministry";

function MinistryMenuLink({
  item,
  pathname,
}: {
  item: SiteNavItem;
  pathname: string;
}) {
  const { label, href, icon: Icon } = item;
  const isActive = item.match(pathname);

  return (
    <DropdownMenuItem asChild>
      <Link
        href={href}
        className={cn(
          "group/item flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md transition-colors",
            isActive
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground group-hover/item:bg-accent group-hover/item:text-foreground"
          )}
        >
          <Icon className="size-3.5" aria-hidden />
        </span>
        {label}
      </Link>
    </DropdownMenuItem>
  );
}

const menuContentClassName =
  "w-56 border border-border/50 bg-popover/95 p-1.5 shadow-lg backdrop-blur-md";

/** Desktop: plain text links, no button backgrounds */
export function DesktopPrimaryNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const mounted = useMounted();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ministryActive = [...siteMinistryNav, ...siteMinistrySecondaryNav].some(
    (item) => item.match(pathname)
  );

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openNow() {
    cancelClose();
    setOpen(true);
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  }

  return (
    <nav aria-label="Primary" className={className}>
      <ul className="flex items-center gap-5">
        {sitePrimaryNav.map((item) => {
          const isActive = item.match(pathname);
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}

        {/* Ministry dropdown — Radix only after mount to avoid hydration ID mismatch */}
        <li
          key="ministry"
          onMouseEnter={mounted ? openNow : undefined}
          onMouseLeave={mounted ? scheduleClose : undefined}
        >
          {mounted ?
            <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
              <DropdownMenuTrigger
                onClick={(e) => e.preventDefault()}
                className={cn(
                  "group inline-flex items-center gap-1 text-sm font-medium transition-colors outline-none",
                  ministryActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {MINISTRY_LABEL}
                <ChevronDown
                  className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180"
                  aria-hidden
                />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="center"
                sideOffset={12}
                onCloseAutoFocus={(e) => e.preventDefault()}
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleClose}
                className={menuContentClassName}
              >
                {siteMinistryNav.map((item) => (
                  <MinistryMenuLink key={item.label} item={item} pathname={pathname} />
                ))}
                <DropdownMenuSeparator className="my-1 bg-border/50" />
                {siteMinistrySecondaryNav.map((item) => (
                  <MinistryMenuLink key={item.label} item={item} pathname={pathname} />
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          : <span
              className={cn(
                "inline-flex items-center gap-1 text-sm font-medium",
                ministryActive
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {MINISTRY_LABEL}
              <ChevronDown className="size-3.5" aria-hidden />
            </span>
          }
        </li>
      </ul>
    </nav>
  );
}