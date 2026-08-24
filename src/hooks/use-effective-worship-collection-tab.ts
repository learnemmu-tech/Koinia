"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import type { WorshipCollectionTab } from "@/hooks/use-store";
import { useWorshipCollectionTab } from "@/hooks/use-store";
import { getContentTypeFromPathname } from "@/lib/worship-collection";

function getTabFromSearchParam(value: string | null): WorshipCollectionTab | null {
  if (value === "songs" || value === "sermons" || value === "articles") {
    return value;
  }
  return null;
}

export function useEffectiveWorshipCollectionTab() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [storedTab, setStoredTab] = useWorshipCollectionTab();
  const routeTab = getContentTypeFromPathname(pathname);
  const queryTab = getTabFromSearchParam(searchParams.get("tab"));

  useEffect(() => {
    const nextTab = routeTab ?? queryTab;
    if (!nextTab) return;

    setStoredTab((current) => (current === nextTab ? current : nextTab));
  }, [routeTab, queryTab, setStoredTab]);

  const activeTab: WorshipCollectionTab = routeTab ?? queryTab ?? storedTab;

  return {
    activeTab,
    setActiveTab: setStoredTab,
    isRouteLocked: routeTab !== null,
  };
}
