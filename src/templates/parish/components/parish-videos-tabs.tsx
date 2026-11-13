"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { AddVideoSheet } from "@/components/videos/add-video-sheet";
import { ChurchVideoCard } from "@/components/videos/church-video-card";
import { ShortsPageClient } from "@/components/shorts/shorts-page-client";
import { ContentListToolbar } from "@/components/worship/content-list-toolbar";
import { TabEmptyState } from "@/components/worship/songs-tab-content";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useAllowTrialWrite } from "@/context/subscription-context";
import { fetchChurchVideos } from "@/lib/videos-client";
import type { ChurchVideo } from "@/types/church-video";
import type { VideoShort } from "@/types/video-short";

export function ParishVideosTabs({
  initialVideos,
  initialShorts,
  churchName,
  canManageVideos,
  canManageShorts,
  canSubmitShorts,
  churchId,
  pendingShorts,
}: {
  initialVideos: ChurchVideo[];
  initialShorts: VideoShort[];
  churchName: string;
  canManageVideos: boolean;
  canManageShorts: boolean;
  canSubmitShorts: boolean;
  churchId: string;
  pendingShorts: VideoShort[];
}) {
  const t = useTranslations("heritage.pages");
  const { user } = useFirebaseAuth();
  const allowWrite = useAllowTrialWrite();
  const [videos, setVideos] = useState(initialVideos);
  const [tab, setTab] = useState<"videos" | "shorts">("videos");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "shorts" || window.location.hash === "#shorts") {
      setTab("shorts");
    }
  }, []);

  function selectTab(value: string) {
    const next = value === "shorts" ? "shorts" : "videos";
    setTab(next);
    const url = new URL(window.location.href);
    if (next === "shorts") url.searchParams.set("tab", "shorts");
    else url.searchParams.delete("tab");
    url.hash = "";
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }

  async function reloadVideos() {
    const token = user ? await user.getIdToken() : undefined;
    const items = await fetchChurchVideos(
      { contentMode: "tenant", churchId },
      token ?? undefined
    );
    setVideos(items);
  }

  function openSubmit() {
    if (
      !allowWrite({
        action: "create",
        resource: "video",
        contentScope: "organization",
      })
    ) {
      return;
    }
    setAddOpen(true);
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const published = videos.filter((video) => video.published || canManageVideos);
    if (!query) return published;
    return published.filter((video) =>
      [video.title, video.description].filter(Boolean).join(" ").toLowerCase().includes(query)
    );
  }, [videos, search, canManageVideos]);

  return (
    <div className="parish-video-tabs">
      <Tabs value={tab} onValueChange={selectTab}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="videos">{t("videos")}</TabsTrigger>
            <TabsTrigger value="shorts">{t("shorts")}</TabsTrigger>
          </TabsList>
          {tab === "videos" && canManageVideos ? (
            <Button type="button" size="sm" onClick={openSubmit}>
              <Plus className="size-4" aria-hidden />
              {t("submitVideo")}
            </Button>
          ) : null}
        </div>
        <TabsContent value="videos" className="mt-4 space-y-4">
          {videos.filter((video) => video.published || canManageVideos).length === 0 ? (
            <TabEmptyState message={t("noVideos")} />
          ) : (
            <>
              <ContentListToolbar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder={t("searchVideos")}
              />
              {filtered.length === 0 ? (
                <TabEmptyState message={t("noVideoMatch")} />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((video) => (
                    <ChurchVideoCard
                      key={video.id}
                      video={video}
                      canManage={canManageVideos}
                      getToken={async () => (user ? user.getIdToken() : null)}
                      onChanged={() => void reloadVideos()}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
        <TabsContent value="shorts" className="mt-4">
          <ShortsPageClient
            initialShorts={initialShorts}
            churchName={churchName}
            canPost={canManageShorts || canSubmitShorts}
            canManage={canManageShorts}
            submitForReview={!canManageShorts && canSubmitShorts}
            churchId={churchId}
            createChurchId={churchId}
            createContentScope="organization"
            initialPendingShorts={canManageShorts ? pendingShorts : []}
            embedded
          />
        </TabsContent>
      </Tabs>
      {canManageVideos ? (
        <AddVideoSheet
          open={addOpen}
          onOpenChange={setAddOpen}
          getToken={async () => (user ? user.getIdToken() : null)}
          onSaved={() => void reloadVideos()}
          contentScope="organization"
          churchId={churchId}
        />
      ) : null}
    </div>
  );
}
