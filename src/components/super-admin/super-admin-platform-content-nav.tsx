import Link from "next/link";

import { SUPER_ADMIN_BASE } from "@/lib/auth/auth-paths";
import {
  PLATFORM_CONTENT_TABS,
  type PlatformContentTab,
  type PlatformContentType,
} from "@/lib/super-admin/platform-content-queries";
import { cn } from "@/lib/utils";

const TAB_LABELS: Record<PlatformContentTab, string> = {
  all: "All content",
  songs: "Songs",
  sermons: "Sermons",
  articles: "Articles",
  shorts: "Shorts",
  events: "Events",
  donations: "Donations",
};

export function SuperAdminPlatformContentNav({
  activeTab,
  counts,
  total,
  params,
}: {
  activeTab: PlatformContentTab;
  counts: Record<PlatformContentType, number>;
  total: number;
  params: Record<string, string>;
}) {
  const buildHref = (tab: PlatformContentTab) => {
    const search = new URLSearchParams();
    if (tab !== "all") search.set("tab", tab);
    for (const [key, value] of Object.entries(params)) {
      if (value.trim()) search.set(key, value.trim());
    }
    const query = search.toString();
    return query
      ? `${SUPER_ADMIN_BASE}/content?${query}`
      : `${SUPER_ADMIN_BASE}/content`;
  };

  return (
    <nav
      aria-label="Platform content types"
      className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
    >
      {PLATFORM_CONTENT_TABS.map((tab) => {
        const isActive = tab === activeTab;
        const count = tab === "all" ? total : counts[tab];

        return (
          <Link
            key={tab}
            href={buildHref(tab)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {TAB_LABELS[tab]}
            <span className="ml-1.5 text-xs opacity-70">
              {count.toLocaleString("en-US")}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
