"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { persistActiveChurchCookie } from "@/lib/church-cookies";
import { cn } from "@/lib/utils";
import { HeritageButton } from "@/templates/heritage/components/heritage-button";
import {
  HeritageLocaleControl,
  HeritageMemberControls,
} from "@/templates/heritage/components/heritage-member-controls";
import { HeritageNavDropdown } from "@/templates/heritage/components/heritage-nav-dropdown";
import type { HeritagePublicNavGroup, HeritagePublicNavLink } from "@/templates/heritage/public-nav";

const CLOSE_DELAY_MS = 90;

const navLinkClass =
  "heritage-nav-link inline-flex h-[4.5rem] items-center whitespace-nowrap rounded-sm text-[0.875rem] font-medium tracking-[-0.01em] text-current transition-colors sm:h-[5rem]";
const navLinkIdle = "hover:text-[var(--heritage-accent)]";
const navLinkActive = "is-active";

export function HeritageNav({
  homeHref,
  churchId,
  churchSlug,
  primary,
  groups,
  isAuthenticated,
  isMember,
  joinHref,
  joinLabel,
  signInHref,
  signInLabel,
}: {
  homeHref: string;
  churchId: string;
  churchSlug: string;
  primary: HeritagePublicNavLink[];
  groups: HeritagePublicNavGroup[];
  isAuthenticated: boolean;
  isMember: boolean;
  joinHref: string;
  joinLabel: string;
  signInHref: string;
  signInLabel: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function isActive(href: string) {
    return href === homeHref
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const openGroup = useCallback(
    (id: string) => {
      cancelClose();
      setOpenGroupId(id);
    },
    [cancelClose]
  );

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      setOpenGroupId(null);
      closeTimer.current = null;
    }, CLOSE_DELAY_MS);
  }, [cancelClose]);

  const closeNow = useCallback(() => {
    cancelClose();
    setOpenGroupId(null);
  }, [cancelClose]);

  const contactIndex = primary.findIndex((item) => item.label === "Contact");
  const leading = contactIndex >= 0 ? primary.slice(0, contactIndex) : primary;
  const trailing = contactIndex >= 0 ? primary.slice(contactIndex) : [];

  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <>
      <nav
        aria-label="Primary"
        className="heritage-header-nav hidden min-w-0 items-center justify-center xl:flex"
      >
        <ul className="flex min-w-0 max-w-full flex-nowrap items-center justify-center gap-x-4">
          {leading.map((item) => (
            <li key={`${item.href}-${item.label}`}>
              <Link
                href={item.href}
                className={cn(
                  navLinkClass,
                  isActive(item.href) ? navLinkActive : navLinkIdle
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
          {groups.map((group) => (
            <HeritageNavDropdown
              key={group.id}
              group={group}
              pathname={pathname}
              homeHref={homeHref}
              churchId={churchId}
              open={openGroupId === group.id}
              onOpen={() => openGroup(group.id)}
              onLeave={scheduleClose}
              onDismiss={closeNow}
            />
          ))}
          {trailing.map((item) => (
            <li key={`${item.href}-${item.label}`}>
              <Link
                href={item.href}
                className={cn(
                  navLinkClass,
                  isActive(item.href) ? navLinkActive : navLinkIdle
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="heritage-header-actions hidden h-[4.5rem] shrink-0 items-center gap-2 sm:h-[5rem] xl:flex">
        {isMember ? (
          <HeritageMemberControls churchId={churchId} churchSlug={churchSlug} />
        ) : (
          <>
            <HeritageLocaleControl />
            {isAuthenticated ? null : (
              <Link href={signInHref} className={cn(navLinkClass, navLinkIdle, "h-auto whitespace-nowrap py-2")}>
                {signInLabel}
              </Link>
            )}
            <HeritageButton href={joinHref} className="whitespace-nowrap rounded-full px-5 py-2" variant="primary" arrow>
              {joinLabel}
            </HeritageButton>
          </>
        )}
      </div>

      <button
        type="button"
        className="heritage-header-toggle inline-flex size-11 shrink-0 items-center justify-center text-current xl:hidden"
        aria-expanded={mobileOpen}
        aria-controls="heritage-mobile-nav"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        onClick={() => setMobileOpen((value) => !value)}
      >
        {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {mobileOpen ? (
        <div
          id="heritage-mobile-nav"
          className="heritage-header-mobile absolute inset-x-0 top-full z-[80] max-h-[min(80dvh,40rem)] overflow-y-auto border-t border-[var(--heritage-border)] bg-[var(--heritage-background)] px-4 py-5 xl:hidden"
        >
          <nav aria-label="Mobile">
            <ul>
              {leading.map((item) => (
                <li key={`${item.href}-${item.label}`}>
                  <Link
                    href={item.href}
                    className="flex min-h-11 items-center py-2 text-[0.95rem] font-medium text-[var(--heritage-text)]"
                    onClick={() => {
                      persistActiveChurchCookie(churchId);
                      setMobileOpen(false);
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            {groups.map((group) => (
              <div
                key={group.id}
                className="border-t border-[var(--heritage-border)] py-2"
              >
                <p className="py-2 text-[0.8rem] font-semibold tracking-[0.14em] uppercase text-[var(--heritage-accent-ink)]">
                  {group.label}
                </p>
                <ul>
                  {group.items.map((item) => (
                    <li key={`${item.href}-${item.label}`}>
                      <Link
                        href={item.href}
                        className="flex min-h-11 items-center py-2 text-[0.95rem] font-medium text-[var(--heritage-text)]"
                        onClick={() => {
                          persistActiveChurchCookie(churchId);
                          setMobileOpen(false);
                        }}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {trailing.length > 0 ? (
              <ul className="border-t border-[var(--heritage-border)]">
                {trailing.map((item) => (
                  <li key={`${item.href}-${item.label}`}>
                    <Link
                      href={item.href}
                      className="flex min-h-11 items-center py-2 text-[0.95rem] font-medium text-[var(--heritage-text)]"
                      onClick={() => {
                        persistActiveChurchCookie(churchId);
                        setMobileOpen(false);
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </nav>
          <div className="mt-4 flex flex-col gap-3">
            {isMember ? (
              <HeritageMemberControls
                churchId={churchId}
                churchSlug={churchSlug}
                onNavigate={() => setMobileOpen(false)}
              />
            ) : (
              <>
                <HeritageLocaleControl align="start" className="w-fit" />
                {isAuthenticated ? null : (
                  <Link
                    href={signInHref}
                    className="flex min-h-11 items-center justify-center text-[0.9375rem] font-semibold text-[var(--heritage-text)]"
                    onClick={() => setMobileOpen(false)}
                  >
                    {signInLabel}
                  </Link>
                )}
                <HeritageButton href={joinHref} className="w-full rounded-full" variant="primary" arrow>
                  {joinLabel}
                </HeritageButton>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
