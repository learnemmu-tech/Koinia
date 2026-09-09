"use client";

import { useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { adminSectionClass } from "@/lib/responsive-classes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminArticlesPageClient } from "@/components/admin/pages/admin-articles-page";
import { AdminDonationsPageClient } from "@/components/admin/pages/admin-donations-page";
import { AdminEventsPageClient } from "@/components/admin/pages/admin-events-page";
import { AdminPrayersPageClient } from "@/components/admin/pages/admin-prayers-page";
import { AdminSermonsPageClient } from "@/components/admin/pages/admin-sermons-page";
import { AdminSongsPageClient } from "@/components/admin/pages/admin-songs-page";

const TABS = [
  { value: "songs", labelKey: "songs" },
  { value: "sermons", labelKey: "sermons" },
  { value: "articles", labelKey: "articles" },
  { value: "events", labelKey: "events" },
  { value: "donations", labelKey: "donations" },
  { value: "prayers", labelKey: "prayerRequests" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

function isValidTab(value: string | null): value is TabValue {
  return TABS.some((tab) => tab.value === value);
}

export function AdminContentManagementClient() {
  const tDashboard = useTranslations("dashboard");
  const tNav = useTranslations("navigation");
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: TabValue = isValidTab(tabParam) ? tabParam : "songs";

  const setTab = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", value);
      router.replace(`/dashboard/content?${params.toString()}`, {
        scroll: false,
      });
    },
    [router, searchParams]
  );

  useEffect(() => {
    if (tabParam && !isValidTab(tabParam)) {
      setTab("songs");
    }
  }, [tabParam, setTab]);

  return (
    <div className={adminSectionClass}>
      <AdminPageHeader
        title={tDashboard("contentTitle")}
        description={tDashboard("contentManageDescription")}
      />

      <Tabs value={activeTab} onValueChange={setTab} className="space-y-4">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-lg px-3 py-2 text-xs sm:text-sm"
            >
              {tNav(tab.labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="songs" className="mt-0">
          <AdminSongsPageClient embedded />
        </TabsContent>
        <TabsContent value="sermons" className="mt-0">
          <AdminSermonsPageClient embedded />
        </TabsContent>
        <TabsContent value="articles" className="mt-0">
          <AdminArticlesPageClient embedded />
        </TabsContent>
        <TabsContent value="events" className="mt-0">
          <AdminEventsPageClient embedded />
        </TabsContent>
        <TabsContent value="donations" className="mt-0">
          <AdminDonationsPageClient embedded />
        </TabsContent>
        <TabsContent value="prayers" className="mt-0">
          <AdminPrayersPageClient embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}
