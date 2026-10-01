"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { persistActiveChurchCookie } from "@/lib/church-cookies";
import { cn } from "@/lib/utils";
import type { HeritagePublicNavGroup } from "@/templates/heritage/public-nav";

const triggerClass =
  "heritage-nav-link inline-flex h-[4.5rem] items-center gap-1 whitespace-nowrap rounded-sm bg-transparent text-[0.875rem] font-medium tracking-[-0.01em] text-current outline-none transition-colors sm:h-[5rem] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--heritage-accent)]";

export function HeritageNavDropdown({
  group,
  pathname,
  homeHref,
  churchId,
  open,
  onOpen,
  onLeave,
  onDismiss,
}: {
  group: HeritagePublicNavGroup;
  pathname: string;
  homeHref: string;
  churchId: string;
  open: boolean;
  onOpen: () => void;
  onLeave: () => void;
  onDismiss: () => void;
}) {
  const rootRef = useRef<HTMLLIElement>(null);
  const menuId = useId();

  function isActive(href: string) {
    return href === homeHref
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  const groupActive = group.items.some((item) => isActive(item.href));

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onDismiss();
        rootRef.current?.querySelector("button")?.focus();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        const first = rootRef.current?.querySelector<HTMLElement>("[role='menuitem']");
        first?.focus();
      }
    }

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        onDismiss();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, onDismiss]);

  return (
    <li
      ref={rootRef}
      className="relative"
      onMouseEnter={onOpen}
      onMouseLeave={onLeave}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          onDismiss();
        }
      }}
    >
      <button
        type="button"
        className={cn(triggerClass, (groupActive || open) && "is-active")}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onFocus={onOpen}
        onClick={() => onOpen()}
      >
        {group.label}
        <ChevronDown
          className={cn("size-3 opacity-70 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      <div
        id={menuId}
        role="menu"
        hidden={!open}
        className={cn(
          "heritage-nav-dropdown text-[var(--heritage-text)]",
          !open && "pointer-events-none"
        )}
      >
        <ul className="heritage-nav-dropdown-panel">
          {group.items.map((item) => (
            <li key={`${item.href}-${item.label}`} role="none">
              <Link
                role="menuitem"
                href={item.href}
                tabIndex={open ? 0 : -1}
                className={cn(
                  "heritage-nav-dropdown-item",
                  isActive(item.href) && "is-active"
                )}
                onClick={() => {
                  persistActiveChurchCookie(churchId);
                  onDismiss();
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}
