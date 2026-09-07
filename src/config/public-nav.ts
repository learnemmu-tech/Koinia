export type PublicNavItem = {
  label: string;
  href: string;
  match: (pathname: string) => boolean;
};

const exact = (href: string) => (pathname: string) => pathname === href;
const startsWith = (href: string) => (pathname: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

/** Header browse links for anonymous visitors. */
export const publicHeaderNav: PublicNavItem[] = [
  {
    label: "Songs",
    href: "/songs",
    match: startsWith("/songs"),
  },
  {
    label: "Sermons",
    href: "/sermons",
    match: startsWith("/sermons"),
  },
  {
    label: "Articles",
    href: "/articles",
    match: startsWith("/articles"),
  },
  {
    label: "Events",
    href: "/events",
    match: startsWith("/events"),
  },
  {
    label: "Shorts",
    href: "/shorts",
    match: startsWith("/shorts"),
  },
  {
    label: "Donations",
    href: "/donations",
    match: startsWith("/donations"),
  },
];

export const publicExploreNav: PublicNavItem[] = [
  { label: "Worship Songs", href: "/songs", match: startsWith("/songs") },
  { label: "Short Videos", href: "/shorts", match: startsWith("/shorts") },
  { label: "Sermons", href: "/sermons", match: startsWith("/sermons") },
  { label: "Articles", href: "/articles", match: startsWith("/articles") },
  { label: "Events", href: "/events", match: startsWith("/events") },
  {
    label: "Support the Mission",
    href: "/donations",
    match: startsWith("/donations"),
  },
];

export const publicCompanyNav: PublicNavItem[] = [
  { label: "About", href: "/about", match: startsWith("/about") },
  { label: "Our Mission", href: "/about", match: startsWith("/about") },
  { label: "Contact", href: "/contact", match: startsWith("/contact") },
  { label: "Help / Support", href: "/contact", match: startsWith("/contact") },
  { label: "Sign In", href: "/signin", match: exact("/signin") },
];

export const publicChurchesNav: PublicNavItem[] = [
  { label: "Create a Church", href: "/signup", match: exact("/signup") },
  { label: "Platform Features", href: "/pricing", match: startsWith("/pricing") },
  { label: "Get Started", href: "/signup", match: exact("/signup") },
];

export const publicLegalNav: PublicNavItem[] = [
  { label: "Privacy Policy", href: "/privacy", match: startsWith("/privacy") },
  { label: "Terms of Service", href: "/terms", match: startsWith("/terms") },
];
