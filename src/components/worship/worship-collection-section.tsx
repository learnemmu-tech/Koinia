"use client";

import React from "react";

import type { FirebaseArticle } from "@/types/firebase-article";
import type { FirebaseSermon } from "@/types/firebase-sermon";
import type { FirebaseSong } from "@/types/firebase-song";

import { ArticlesTabContent } from "@/components/worship/articles-tab-content";
import { SermonsTabContent } from "@/components/worship/sermons-tab-content";
import { SongsTabContent } from "@/components/worship/songs-tab-content";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffectiveWorshipCollectionTab } from "@/hooks/use-effective-worship-collection-tab";

export type WorshipCollectionTab = "songs" | "sermons" | "articles";

type WorshipCollectionSectionProps = {
  songs: FirebaseSong[];
  sermons: FirebaseSermon[];
  articles: FirebaseArticle[];
  /**
   * Optional sections rendered only when the matching tab is active. This keeps
   * each tab a focused experience and lets us add tab-specific content (e.g. the
   * Prayer Wall on Songs) without leaking into the other tabs.
   */
  songsTabExtra?: React.ReactNode;
  sermonsTabExtra?: React.ReactNode;
  articlesTabExtra?: React.ReactNode;
};

export function WorshipCollectionSection({
  songs,
  sermons,
  articles,
  songsTabExtra,
  sermonsTabExtra,
  articlesTabExtra,
}: WorshipCollectionSectionProps) {
  const { activeTab, setActiveTab, isRouteLocked } =
    useEffectiveWorshipCollectionTab();

  return (
    <section className="w-full space-y-5">
      <div className="space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/60">
          Worship Collection
        </p>
        <h2 className="font-heading text-xl font-bold sm:text-2xl md:text-3xl">
          Explore
        </h2>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (!isRouteLocked) {
            setActiveTab(value as WorshipCollectionTab);
          }
        }}
        className="w-full"
      >
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl border border-border/50 bg-muted/50 p-1 sm:w-auto sm:inline-flex">
          <TabsTrigger
            value="songs"
            className="rounded-lg px-4 py-2 text-xs font-semibold sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Songs
          </TabsTrigger>
          <TabsTrigger
            value="sermons"
            className="rounded-lg px-4 py-2 text-xs font-semibold sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Sermons
          </TabsTrigger>
          <TabsTrigger
            value="articles"
            className="rounded-lg px-4 py-2 text-xs font-semibold sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Articles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="songs" className="mt-5 focus-visible:outline-none">
          {activeTab === "songs" ? (
            <div className="space-y-6">
              <SongsTabContent initialSongs={songs} />
              {songsTabExtra}
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="sermons" className="mt-5 focus-visible:outline-none">
          {activeTab === "sermons" ? (
            <div className="space-y-6">
              {sermonsTabExtra}
              <SermonsTabContent initialSermons={sermons} />
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="articles" className="mt-5 focus-visible:outline-none">
          {activeTab === "articles" ? (
            <div className="space-y-6">
              {articlesTabExtra}
              <ArticlesTabContent initialArticles={articles} />
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </section>
  );
}
