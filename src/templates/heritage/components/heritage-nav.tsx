"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
const XL_MIN_WIDTH = 1280;

const navLinkClass =
  "heritage-nav-link inline-flex h-[4.5rem] items-center whitespace-nowrap rounded-sm text-[0.875rem] font-medium tracking-[-0.01em] text-current transition-colors sm:h-[5rem]";
const navLinkIdle = "hover:text-[var(--heritage-accent)]";
const navLinkActive = "is-active";

const mobileLinkClass =
  "flex min-h-11 items-center py-2.5 text-[0.95rem] font-medium text-[#fbf8f1]";

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
  const drawerTitleId = useId();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const wasMobileOpen = useRef(false);

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

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const contactIndex = primary.findIndex((item) => item.label === "Contact");
  const leading = contactIndex >= 0 ? primary.slice(0, contactIndex) : primary;
  const trailing = contactIndex >= 0 ? primary.slice(contactIndex) : [];

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    previouslyFocused.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : toggleRef.current;
    const frame = window.requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMobile();
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function onResize() {
      if (window.innerWidth >= XL_MIN_WIDTH) closeMobile();
    }

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [mobileOpen, closeMobile]);

  useEffect(() => {
    if (mobileOpen) {
      wasMobileOpen.current = true;
      return;
    }
    if (!wasMobileOpen.current) return;
    wasMobileOpen.current = false;
    const restore = previouslyFocused.current ?? toggleRef.current;
    restore?.focus();
    previouslyFocused.current = null;
  }, [mobileOpen]);

  function onMobileNavigate() {
    persistActiveChurchCookie(churchId);
    closeMobile();
  }

  const mobileNav = (
    <div
      className={cn("heritage-nav-layer xl:hidden", mobileOpen && "is-open")}
      aria-hidden={!mobileOpen}
    >
      <button
        type="button"
        className={cn("heritage-nav-scrim", mobileOpen && "is-open")}
        aria-label="Close menu"
        tabIndex={mobileOpen ? 0 : -1}
        onClick={closeMobile}
      />
      <aside
        ref={drawerRef}
        id="heritage-mobile-nav"
        className={cn("heritage-theme heritage-nav-drawer", mobileOpen && "is-open")}
        role="dialog"
        aria-modal={mobileOpen}
        aria-labelledby={drawerTitleId}
        inert={!mobileOpen}
      >
        <div className="heritage-nav-drawer-head">
          <p id={drawerTitleId} className="heritage-nav-drawer-title">
            Menu
          </p>
          <button
            ref={closeBtnRef}
            type="button"
            className="heritage-nav-drawer-close"
            aria-label="Close menu"
            onClick={closeMobile}
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="heritage-nav-drawer-body heritage-header-mobile">
          <nav aria-label="Mobile">
            <ul>
              {leading.map((item) => (
                <li key={`${item.href}-${item.label}`}>
                  <Link href={item.href} className={mobileLinkClass} onClick={onMobileNavigate}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            {groups.map((group) => (
              <div key={group.id} className="heritage-nav-drawer-section">
                <p className="heritage-nav-drawer-heading">{group.label}</p>
                <ul>
                  {group.items.map((item) => (
                    <li key={`${item.href}-${item.label}`}>
                      <Link href={item.href} className={mobileLinkClass} onClick={onMobileNavigate}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {trailing.length > 0 ? (
              <ul className="heritage-nav-drawer-section">
                {trailing.map((item) => (
                  <li key={`${item.href}-${item.label}`}>
                    <Link href={item.href} className={mobileLinkClass} onClick={onMobileNavigate}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </nav>
          <div className="heritage-nav-drawer-footer">
            {isMember ? (
              <HeritageMemberControls
                churchId={churchId}
                churchSlug={churchSlug}
                onNavigate={closeMobile}
              />
            ) : (
              <>
                <HeritageLocaleControl align="start" className="w-fit" />
                {isAuthenticated ? null : (
                  <Link
                    href={signInHref}
                    className="flex min-h-11 items-center justify-center text-[0.9375rem] font-semibold text-[#fbf8f1]"
                    onClick={closeMobile}
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
      </aside>
    </div>
  );

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
        ref={toggleRef}
        type="button"
        className="heritage-header-toggle inline-flex size-11 shrink-0 items-center justify-center text-current xl:hidden"
        aria-expanded={mobileOpen}
        aria-controls="heritage-mobile-nav"
        aria-label="Open menu"
        onClick={() => setMobileOpen((value) => !value)}
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {portalReady ? createPortal(mobileNav, document.body) : null}
    </>
  );
}
