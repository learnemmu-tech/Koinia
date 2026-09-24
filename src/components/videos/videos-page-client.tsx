"use client";

import React from "react";
import { Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import type { ChurchVideo } from "@/types/church-video";
import type { VideoShort } from "@/types/video-short";
import { ChurchVideoCard } from "@/components/videos/church-video-card";
import { AddVideoSheet } from "@/components/videos/add-video-sheet";
import { ShortsPageClient } from "@/components/shorts/shorts-page-client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabEmptyState } from "@/components/worship/songs-tab-content";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useAllowTrialWrite } from "@/context/subscription-context";
import { fetchChurchVideos } from "@/lib/videos-client";
import { contentCardGridClassName, typePageTitleClass } from "@/lib/responsive-classes";

type VideosPageClientProps = {
  initialVideos: ChurchVideo[];
  initialShorts: VideoShort[];
  churchName: string;
  canManageVideos: boolean;
  canManageShorts: boolean;
  canSubmitShorts: boolean;
  createContentScope: "organization" | "platform_public";
  createChurchId: string;
  churchId: string;
  initialShortId?: string;
  pendingShorts: VideoShort[];
};

export function VideosPageClient({
  initialVideos,
  initialShorts,
  churchName,
  canManageVideos,
  canManageShorts,
  canSubmitShorts,
  createContentScope,
  createChurchId,
  churchId,
  initialShortId,
  pendingShorts,
}: VideosPageClientProps) {
  const { user } = useFirebaseAuth();
  const allowWrite = useAllowTrialWrite();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = tabParam === "shorts" ? "shorts" : "videos";

  const [videos, setVideos] = React.useState(initialVideos);
  const [addOpen, setAddOpen] = React.useState(false);

  const getToken = React.useCallback(
    async (forceRefresh = false) => {
      if (!user) return null;
      return user.getIdToken(forceRefresh);
    },
    [user]
  );

  function setTab(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "videos") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    const query = params.toString();
    router.replace(query ? `/videos?${query}` : "/videos", { scroll: false });
  }

  async function reloadVideos() {
    const token = await getToken();
    const items = await fetchChurchVideos(
      {
        contentMode: createChurchId || churchId ? "tenant" : "platform_public",
        churchId: createChurchId || churchId,
      },
      token ?? undefined
    );
    setVideos(items);
  }

  const publishedVideos = canManageVideos
    ? videos
    : videos.filter((video) => video.published);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/60">
            Church media
          </p>
          <h1 id="videos-heading" className={typePageTitleClass}>
            Videos
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Official church videos and community Shorts.
          </p>
        </div>
        {activeTab === "videos" && canManageVideos ?
          <Button
            type="button"
            size="sm"
            className="shrink-0 gap-1.5 rounded-full"
            onClick={() => {
              if (
                !allowWrite({
                  action: "create",
                  resource: "video",
                  contentScope: createContentScope,
                })
              ) {
                return;
              }
              setAddOpen(true);
            }}
          >
            <Plus className="size-4" aria-hidden />
            Add Video
          </Button>
        : null}
      </header>

      <Tabs value={activeTab} onValueChange={setTab} className="space-y-4">
        <TabsList className="h-auto w-full justify-start gap-1 bg-muted/50 p-1 sm:w-auto">
          <TabsTrigger value="videos" className="rounded-lg px-3 py-2">
            Videos
          </TabsTrigger>
          <TabsTrigger value="shorts" className="rounded-lg px-3 py-2">
            Shorts
            {canManageShorts && pendingShorts.length > 0 ?
              <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {pendingShorts.length}
              </span>
            : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="mt-0 space-y-4">
          {publishedVideos.length === 0 ?
            <div className="space-y-4">
              <TabEmptyState message="No videos published yet" />
              {canManageVideos ?
                <div className="flex justify-center">
                  <Button
                    onClick={() => {
                      if (
                        !allowWrite({
                          action: "create",
                          resource: "video",
                          contentScope: createContentScope,
                        })
                      ) {
                        return;
                      }
                      setAddOpen(true);
                    }}
                    className="gap-1.5"
                  >
                    <Plus className="size-4" />
                    Add Video
                  </Button>
                </div>
              : null}
            </div>
          : <div className={contentCardGridClassName}>
              {publishedVideos.map((video) => (
                <ChurchVideoCard
                  key={video.id}
                  video={video}
                  canManage={canManageVideos}
                  getToken={getToken}
                  onChanged={() => void reloadVideos()}
                />
              ))}
            </div>
          }
        </TabsContent>

        <TabsContent value="shorts" className="mt-0">
          <ShortsPageClient
            initialShorts={initialShorts}
            churchName={churchName}
            canPost={canManageShorts || canSubmitShorts}
            canManage={canManageShorts}
            submitForReview={!canManageShorts && canSubmitShorts}
            createContentScope={createContentScope}
            createChurchId={createChurchId}
            churchId={churchId}
            initialShortId={initialShortId}
            initialPendingShorts={pendingShorts}
            embedded
          />
        </TabsContent>
      </Tabs>

      {canManageVideos ?
        <AddVideoSheet
          open={addOpen}
          onOpenChange={setAddOpen}
          getToken={getToken}
          onSaved={() => void reloadVideos()}
          contentScope={createContentScope}
          churchId={createChurchId}
        />
      : null}
    </section>
  );
}
