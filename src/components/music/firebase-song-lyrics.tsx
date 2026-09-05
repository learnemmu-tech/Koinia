"use client";

import React from "react";
import { Music2 } from "lucide-react";

import { getLyricsDisplayContent } from "@/lib/song-lyrics";
import { cn } from "@/lib/utils";

type FirebaseSongLyricsProps = {
  englishLyrics: string;
  translatedLyrics?: string;
  variant?: "default" | "song-detail";
};

type LyricsLine =
  | { kind: "section"; text: string; key: string }
  | { kind: "stanza"; lines: string[]; key: string };

const SECTION_LABEL =
  /^(verse|chorus|bridge|pre-chorus|prechorus|intro|outro|hook|tag|interlude|ending|refrain)(\s+\d+)?\s*:?$/i;

function isSectionMarker(trimmed: string): boolean {
  if (/^\|\|.+?\|\|$/.test(trimmed)) return true;
  return SECTION_LABEL.test(trimmed);
}

function sectionLabelText(trimmed: string): string {
  const wrapped = trimmed.match(/^\|\|(.+?)\|\|$/);
  return (wrapped?.[1] ?? trimmed).trim();
}

function parseLyricsBlocks(content: string): LyricsLine[] {
  const blocks: LyricsLine[] = [];
  let stanza: string[] = [];
  let index = 0;

  function flushStanza() {
    if (stanza.length === 0) return;
    blocks.push({ kind: "stanza", lines: stanza, key: `stanza-${index++}` });
    stanza = [];
  }

  for (const rawLine of content.split("\n")) {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushStanza();
      continue;
    }

    if (isSectionMarker(trimmed)) {
      flushStanza();
      blocks.push({
        kind: "section",
        text: sectionLabelText(trimmed),
        key: `section-${index++}`,
      });
      continue;
    }

    stanza.push(rawLine);
  }

  flushStanza();
  return blocks;
}

function LyricsReadingColumn({
  content,
  emptyMessage,
}: {
  content: string;
  emptyMessage: string;
}) {
  if (!content.trim()) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
    );
  }

  const blocks = parseLyricsBlocks(content);

  return (
    <div className="w-full">
      {blocks.map((block, blockIndex) => {
        if (block.kind === "section") {
          return (
            <p
              key={block.key}
              className={cn(
                "mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground",
                blockIndex === 0 ? "mt-0" : "mt-6"
              )}
            >
              {block.text}
            </p>
          );
        }

        return (
          <p
            key={block.key}
            className={cn(
              "whitespace-pre-line font-sans text-[15px] font-normal leading-[1.6] text-foreground/90",
              "dark:text-[#E5E5E5]",
              blockIndex < blocks.length - 1 && "mb-4"
            )}
          >
            {block.lines.join("\n")}
          </p>
        );
      })}
    </div>
  );
}

function LyricsTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        active
          ? "border border-foreground/90 bg-background text-foreground dark:border-white dark:bg-[#0A0A0A] dark:text-white"
          : "border border-transparent bg-transparent text-muted-foreground hover:text-foreground dark:text-[#A1A1A1] dark:hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

function DetailLyricsPanel({
  englishDisplay,
  translatedDisplay,
}: {
  englishDisplay: string;
  translatedDisplay: string;
}) {
  const defaultTab = englishDisplay ? "english" : "translated";
  const showBothTabs = Boolean(englishDisplay && translatedDisplay);
  const [lang, setLang] = React.useState<"english" | "translated">(defaultTab);
  const [visible, setVisible] = React.useState(true);

  const showEnglish = lang === "english";
  const activeContent = showEnglish ? englishDisplay : translatedDisplay;
  const emptyMessage = showEnglish
    ? "English lyrics are not available for this song."
    : "Translation is not available for this song.";

  function switchLang(next: "english" | "translated") {
    if (next === lang) return;
    setVisible(false);
    window.setTimeout(() => {
      setLang(next);
      setVisible(true);
    }, 120);
  }

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card",
        "dark:border-[#202020] dark:bg-[#101010]"
      )}
    >
      <div className="px-5 pt-5 sm:px-6">
        <header className="mb-3 flex items-center gap-2">
          <Music2
            className="size-[18px] shrink-0 text-violet-400 dark:text-violet-400"
            aria-hidden
          />
          <h2 className="text-base font-semibold text-foreground sm:text-lg">Lyrics</h2>
        </header>

        {showBothTabs ?
          <div
            role="tablist"
            aria-label="Lyrics language"
            className={cn(
              "mb-4 inline-flex max-w-full items-center gap-1 rounded-lg p-1",
              "border border-border bg-muted/40 dark:border-[#242424] dark:bg-[#111111]"
            )}
          >
            <LyricsTabButton
              active={showEnglish}
              onClick={() => switchLang("english")}
            >
              English Lyrics
            </LyricsTabButton>
            <LyricsTabButton
              active={!showEnglish}
              onClick={() => switchLang("translated")}
            >
              Translation
            </LyricsTabButton>
          </div>
        : null}
      </div>

      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        <div
          className={cn(
            "rounded-xl border border-border px-4 py-4 transition-all duration-200 ease-out sm:px-5 sm:py-5",
            "dark:border-[#2A2A2A]",
            visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
          )}
        >
          <LyricsReadingColumn content={activeContent} emptyMessage={emptyMessage} />
        </div>
      </div>
    </article>
  );
}

export function FirebaseSongLyrics({
  englishLyrics,
  translatedLyrics,
  variant = "default",
}: FirebaseSongLyricsProps) {
  const { englishDisplay, translatedDisplay } = getLyricsDisplayContent(
    englishLyrics,
    translatedLyrics
  );

  if (!englishDisplay && !translatedDisplay) return null;

  if (variant === "song-detail") {
    return (
      <DetailLyricsPanel
        englishDisplay={englishDisplay}
        translatedDisplay={translatedDisplay}
      />
    );
  }

  const defaultTab = englishDisplay ? "english" : "translated";

  return (
    <DefaultLyricsTabs
      defaultTab={defaultTab}
      englishDisplay={englishDisplay}
      translatedDisplay={translatedDisplay}
    />
  );
}

function DefaultLyricsTabs({
  defaultTab,
  englishDisplay,
  translatedDisplay,
}: {
  defaultTab: "english" | "translated";
  englishDisplay: string;
  translatedDisplay: string;
}) {
  const [lang, setLang] = React.useState(defaultTab);

  return (
    <div className="w-full">
      <div className="mb-6 grid h-auto w-full max-w-md grid-cols-2 gap-1 rounded-lg bg-muted/60 p-1">
        <button
          type="button"
          onClick={() => setLang("english")}
          className={cn(
            "rounded-md px-3 py-2.5 text-xs font-semibold sm:text-sm",
            lang === "english"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground"
          )}
        >
          English Lyrics
        </button>
        <button
          type="button"
          onClick={() => setLang("translated")}
          className={cn(
            "rounded-md px-3 py-2.5 text-xs font-semibold sm:text-sm",
            lang === "translated"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground"
          )}
        >
          Translation
        </button>
      </div>

      <div className="rounded-xl bg-muted/15 px-5 py-6 sm:px-7 sm:py-7">
        <LyricsReadingColumn
          content={lang === "english" ? englishDisplay : translatedDisplay}
          emptyMessage={
            lang === "english"
              ? "English lyrics are not available for this song."
              : "Translation is not available for this song."
          }
        />
      </div>
    </div>
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
