import {
  Disc3,
  History,
  Library,
  ListMusic,
  Mic2,
  Podcast,
  Radio,
  Star,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  hidden?: boolean;
};

export const sidebarNav: NavItem[] = [
  {
    title: "Top Albums",
    href: "/album",
    icon: Library,
  },
  {
    title: "Top Charts",
    href: "/chart",
    icon: Disc3,
    hidden: true,
  },
  {
    title: "Top Playlists",
    href: "/playlist",
    icon: ListMusic,
  },
  {
    title: "Podcasts",
    href: "/show",
    icon: Podcast,
    hidden: true,
  },
  {
    title: "Top Artists",
    href: "/artist",
    icon: Mic2,
    hidden: true,
  },
  {
    title: "Radio",
    href: "/radio",
    icon: Radio,
    hidden: true,
  },

  // authenticated routes
  {
    title: "Recently Played",
    href: "/me/recently-played",
    icon: History,
  },
  {
    title: "Your Favorite",
    href: "/me/liked-songs",
    icon: Star,
  },
];
