import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CalendarDays,
  FileText,
  HeartHandshake,
  Home,
  Info,
  Lock,
  Mic2,
  Sparkles,
  Tag,
} from "lucide-react";

export type SiteNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
};

/** Primary links shown directly in the header. */
export const sitePrimaryNav: SiteNavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: Home,
    match: (pathname) => pathname === "/",
  },
  {
    label: "About",
    href: "/about",
    icon: Info,
    match: (pathname) => pathname.startsWith("/about"),
  },
  {
    label: "Pricing",
    href: "/pricing",
    icon: Tag,
    match: (pathname) => pathname.startsWith("/pricing"),
  },
];

/** Ministry menu — worship platform features. */
export const siteMinistryNav: SiteNavItem[] = [
  {
    label: "Sermons",
    href: "/sermons",
    icon: Mic2,
    match: (pathname) =>
      pathname === "/sermons" || pathname.startsWith("/sermons/"),
  },
  {
    label: "Articles",
    href: "/articles",
    icon: BookOpen,
    match: (pathname) =>
      pathname === "/articles" || pathname.startsWith("/articles/"),
  },
  {
    label: "Prayer Requests",
    href: "/prayer-requests",
    icon: Sparkles,
    match: (pathname) => pathname.startsWith("/prayer-requests"),
  },
  {
    label: "Events",
    href: "/events",
    icon: CalendarDays,
    match: (pathname) => pathname.startsWith("/events"),
  },
  {
    label: "Donations",
    href: "/donations",
    icon: HeartHandshake,
    match: (pathname) => pathname.startsWith("/donations"),
  },
];

/** Footer links inside the Ministry dropdown. */
export const siteMinistrySecondaryNav: SiteNavItem[] = [
  {
    label: "Privacy Policy",
    href: "/privacy",
    icon: Lock,
    match: (pathname) => pathname.startsWith("/privacy"),
  },
  {
    label: "Terms of Service",
    href: "/terms",
    icon: FileText,
    match: (pathname) => pathname.startsWith("/terms"),
  },
];
