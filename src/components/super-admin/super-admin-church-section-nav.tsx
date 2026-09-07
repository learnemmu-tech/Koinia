import Link from "next/link";

import { SUPER_ADMIN_BASE } from "@/lib/auth/auth-paths";
import type { SuperAdminChurchTab } from "@/lib/super-admin/church-queries";
import { cn } from "@/lib/utils";

const TABS: { id: SuperAdminChurchTab; label: string }[] = [
  { id: "members", label: "Members" },
  { id: "songs", label: "Worship songs" },
  { id: "sermons", label: "Sermons" },
  { id: "articles", label: "Articles" },
  { id: "events", label: "Events" },
  { id: "prayers", label: "Prayer requests" },
  { id: "donations", label: "Donations" },
  { id: "shorts", label: "Shorts" },
];

export function SuperAdminChurchSectionNav({
  churchId,
  activeTab,
  counts,
}: {
  churchId: string;
  activeTab: SuperAdminChurchTab;
  counts: Record<SuperAdminChurchTab, number>;
}) {
  return (
    <nav
      aria-label="Church content sections"
      className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
    >
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <Link
            key={tab.id}
            href={`${SUPER_ADMIN_BASE}/churches/${churchId}?tab=${tab.id}`}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-70">
              {counts[tab.id].toLocaleString("en-US")}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
