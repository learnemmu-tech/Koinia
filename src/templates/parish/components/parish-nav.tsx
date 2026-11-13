"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  Church,
  Clapperboard,
  HandHeart,
  Menu,
  MessageCircle,
  Music,
  Newspaper,
  Sparkles,
  Video,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { HeaderUserMenu } from "@/components/app-sidebar/header-user-menu";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { ParishButton } from "@/templates/parish/components/parish-button";
import {
  parishNavMessageKey,
  type ParishNavLink,
} from "@/templates/parish/public-nav";

export function ParishNav({
  homeHref,
  primary,
  pages,
  isAuthenticated,
  joinHref,
  signInHref,
}: {
  homeHref: string;
  primary: ParishNavLink[];
  pages: ParishNavLink[];
  isAuthenticated: boolean;
  joinHref: string;
  signInHref: string;
}) {
  const pathname = usePathname();
  const tNav = useTranslations("heritage.nav");
  const tCommon = useTranslations("heritage.common");
  const { authUser } = useFirebaseAuth();
  const [open, setOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);
  const closePagesTimer = useRef<number | null>(null);
  function showPages() {
    if (closePagesTimer.current) window.clearTimeout(closePagesTimer.current);
    setPagesOpen(true);
  }
  function hidePagesSoon() {
    closePagesTimer.current = window.setTimeout(() => setPagesOpen(false), 180);
  }
  const labelOf = (label: string) => {
    const key = parishNavMessageKey(label);
    return key ? tNav(key) : label;
  };
  const links = [...primary, ...pages];
  const pageIcon = (label: string) => {
    if (label === "About Us" || label === "About") return Church;
    if (label === "Events") return CalendarDays;
    if (label === "Worship Songs") return Music;
    if (label === "Articles") return Newspaper;
    if (label === "Books") return BookOpen;
    if (label === "Videos") return Video;
    if (label === "Shorts") return Clapperboard;
    if (label === "Prayer Requests") return HandHeart;
    if (label === "Community") return MessageCircle;
    return Sparkles;
  };

  function active(href: string) {
    return href === homeHref ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="parish-bar">
      <nav className="parish-nav-links" aria-label="Parish">
        <Link href={homeHref} className={`parish-nav-link${active(homeHref) ? " is-active" : ""}`}>
          {labelOf("Home")}
        </Link>
        {pages.length > 0 ? (
          <div
            className="parish-pages"
            onMouseEnter={showPages}
            onMouseLeave={hidePagesSoon}
          >
            <button
              type="button"
              className="parish-nav-link"
              aria-expanded={pagesOpen}
              aria-controls="parish-pages-menu"
              onClick={() => setPagesOpen((value) => !value)}
              onFocus={showPages}
            >
              {tNav("pages")}
            </button>
            <div
              id="parish-pages-menu"
              className={`parish-pages-menu${pagesOpen ? " is-open" : ""}`}
              onFocus={showPages}
              onBlur={hidePagesSoon}
            >
              {pages.map((item) => {
                const Icon = pageIcon(item.label);
                return (
                  <Link key={`${item.href}:${item.label}`} href={item.href}>
                    <Icon aria-hidden className="h-4 w-4" />
                    {labelOf(item.label)}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
        {primary.filter((item) => item.href !== homeHref).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`parish-nav-link${active(item.href) ? " is-active" : ""}`}
          >
            {labelOf(item.label)}
          </Link>
        ))}
      </nav>
      <div className="parish-header-actions">
        <LocaleSwitcher iconOnly className="parish-locale" menuClassName="parish-locale-menu" />
        <div className="parish-header-auth">
          {isAuthenticated ? (
            <>
              {authUser ? (
                <NotificationBell userId={authUser.uid} menuClassName="parish-portal-menu" />
              ) : null}
              <HeaderUserMenu
                variant="heritage"
                profileHref={`${homeHref}/profile`}
                menuClassName="parish-portal-menu"
                signOutRedirect={homeHref}
              />
            </>
          ) : (
            <>
              <Link href={signInHref} className="parish-nav-link">
                {tCommon("signIn")}
              </Link>
              <ParishButton href={joinHref}>{tCommon("joinUs")}</ParishButton>
            </>
          )}
        </div>
        <button
        type="button"
        className="parish-menu-btn"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X /> : <Menu />}
        <span className="sr-only">Menu</span>
        </button>
      </div>
      {open ? (
        <div className="parish-drawer">
          {links.map((item) => (
            <Link key={`${item.href}:${item.label}`} href={item.href} onClick={() => setOpen(false)}>
              {labelOf(item.label)}
            </Link>
          ))}
          {!isAuthenticated ? (
            <div className="mt-3 flex gap-2">
              <ParishButton href={signInHref}>{tCommon("signIn")}</ParishButton>
              <ParishButton href={joinHref} variant="gold">
                {tCommon("joinUs")}
              </ParishButton>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
