"use client";

import React from "react";
import { Music2 } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLyricsDisplayContent } from "@/lib/song-lyrics";
import { cn } from "@/lib/utils";

type FirebaseSongLyricsProps = {
  englishLyrics: string;
  translatedLyrics?: string;
};

function LyricsBlock({
  content,
  variant,
  emptyMessage,
}: {
  content: string;
  variant: "english" | "translated";
  emptyMessage: string;
}) {
  if (!content.trim()) {
    return (
      <p className="py-10 text-center font-sans text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto max-w-2xl space-y-0.5",
        variant === "english" ? "font-sans" : "font-sans"
      )}
    >
      {content.split("\n").map((line, index) => {
        const trimmed = line.trim();
        const isSectionMarker = /^\|\|.+?\|\|$/.test(trimmed);
        const isVerseLabel = /^(verse|chorus|bridge|pre-chorus|intro|outro|hook)\s*\d*:?$/i.test(
          trimmed
        );

        if (!trimmed) {
          return <div key={`gap-${index}`} className="h-3.5" aria-hidden />;
        }

        if (isSectionMarker) {
          return (
            <p
              key={`section-${index}`}
              className="pt-4 font-heading text-sm font-semibold tracking-tight text-foreground first:pt-0"
            >
              {trimmed}
            </p>
          );
        }

        return (
          <p
            key={`line-${index}`}
            className={cn(
              isVerseLabel
                ? "pt-3 font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-primary/75 first:pt-0"
                : cn(
                    "text-[0.9375rem] font-normal leading-[1.9] tracking-[0.01em] text-foreground/92 sm:text-base sm:leading-[2]",
                    variant === "translated" && "font-reading"
                  )
            )}
          >
            {line}
          </p>
        );
      })}
    </div>
  );
}

export function FirebaseSongLyrics({
  englishLyrics,
  translatedLyrics,
}: FirebaseSongLyricsProps) {
  const { englishDisplay, translatedDisplay } = getLyricsDisplayContent(
    englishLyrics,
    translatedLyrics
  );

  if (!englishDisplay && !translatedDisplay) return null;

  const defaultTab = englishDisplay ? "english" : "translated";

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="mb-6 grid h-auto w-full max-w-md grid-cols-2 gap-1 rounded-lg bg-muted/60 p-1">
        <TabsTrigger
          value="english"
          className="rounded-md px-3 py-2.5 font-sans text-xs font-semibold sm:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
        >
          English Lyrics
        </TabsTrigger>
        <TabsTrigger
          value="translated"
          className="rounded-md px-3 py-2.5 font-sans text-xs font-semibold sm:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
        >
          Translated Lyrics
        </TabsTrigger>
      </TabsList>

      <TabsContent value="english" className="mt-0 focus-visible:outline-none">
        <div className="rounded-xl bg-muted/15 px-5 py-6 sm:px-7 sm:py-7">
          <LyricsBlock
            content={englishDisplay}
            variant="english"
            emptyMessage="English lyrics are not available for this song."
          />
        </div>
      </TabsContent>

      <TabsContent value="translated" className="mt-0 focus-visible:outline-none">
        <div className="rounded-xl bg-muted/15 px-5 py-6 sm:px-7 sm:py-7">
          <LyricsBlock
            content={translatedDisplay}
            variant="translated"
            emptyMessage="Translated lyrics are not available for this song."
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}

export function SongLyricsSectionHeader() {
  return (
    <div className="flex items-center gap-2">
      <Music2 className="h-4 w-4 text-primary" aria-hidden />
      <h2 className="font-heading text-base font-semibold sm:text-lg">Lyrics</h2>
    </div>
  );
}
