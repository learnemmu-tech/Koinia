"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FetchErrorBanner } from "@/components/ui/fetch-error-banner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEFAULT_SONG_COVER } from "@/config/site";
import { useRecentlyViewed } from "@/context/recently-viewed-context";
import { useResolvedRecentlyViewedItems } from "@/hooks/use-resolved-recently-viewed-items";
import type { ResolvedRecentlyViewedItem } from "@/hooks/use-resolved-recently-viewed-items";
import {
  formatRecentlyViewedAt,
  getRecentlyViewedContentPath,
} from "@/lib/recently-viewed-firestore";
import { pageContentClass, typePageTitleClass } from "@/lib/responsive-classes";
import { getSongDisplayTitle } from "@/lib/song-firestore";
import { cn, getSongCoverUrl } from "@/lib/utils";
import { ImageWithFallback } from "@/components/image-with-fallback";

const TYPE_LABELS = {
  song: "Song",
  sermon: "Sermon",
  article: "Article",
} as const;

type FilterTab = "all" | "songs" | "sermons" | "articles";

export function RecentlyViewedPageClient() {
  const { recentlyViewed, loading: historyLoading, clearHistory } =
    useRecentlyViewed();
  const { items, loading: itemsLoading, error } =
    useResolvedRecentlyViewedItems(recentlyViewed);
  const [clearing, setClearing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const loading = historyLoading || itemsLoading;

  const filteredItems = useMemo(() => {
    switch (activeTab) {
      case "songs":
        return items.filter((entry) => entry.itemType === "song");
      case "sermons":
        return items.filter((entry) => entry.itemType === "sermon");
      case "articles":
        return items.filter((entry) => entry.itemType === "article");
      default:
        return items;
    }
  }, [activeTab, items]);

  const songCount = items.filter((entry) => entry.itemType === "song").length;
  const sermonCount = items.filter((entry) => entry.itemType === "sermon").length;
  const articleCount = items.filter((entry) => entry.itemType === "article").length;

  async function handleClearHistory() {
    setClearing(true);
    try {
      await clearHistory();
      toast.success("Recently viewed history cleared");
    } catch {
      toast.error("Unable to clear history. Please try again.");
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className={pageContentClass}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/60">
            Your Library
          </p>
          <h1 className={typePageTitleClass}>Recently Viewed</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Songs, sermons, and articles you have opened recently, sorted by
            most recent first.
          </p>
        </div>

        {recentlyViewed.length > 0 ?
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full shrink-0 rounded-full sm:w-auto"
                disabled={clearing || loading}
              >
                Clear history
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>Clear recently viewed?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes your viewing history. You can still find content
                  by browsing songs, sermons, and articles.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => void handleClearHistory()}
                  disabled={clearing}
                >
                  {clearing ? "Clearing…" : "Clear history"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        : null}
      </div>

      {error ?
        <FetchErrorBanner message={error} />
      : null}

      {loading ?
        <RecentlyViewedListSkeleton />
      : recentlyViewed.length === 0 ?
        <EmptyState />
      : <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as FilterTab)}
          className="space-y-6"
        >
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl border border-border/50 bg-muted/50 p-1 sm:max-w-2xl sm:grid-cols-4">
            <TabsTrigger value="all" className="rounded-lg text-xs sm:text-sm">
              All ({items.length})
            </TabsTrigger>
            <TabsTrigger value="songs" className="rounded-lg text-xs sm:text-sm">
              Songs ({songCount})
            </TabsTrigger>
            <TabsTrigger value="sermons" className="rounded-lg text-xs sm:text-sm">
              Sermons ({sermonCount})
            </TabsTrigger>
            <TabsTrigger value="articles" className="rounded-lg text-xs sm:text-sm">
              Articles ({articleCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {filteredItems.length === 0 ?
              <EmptyTab message={`No recently viewed ${activeTab === "all" ? "items" : activeTab} yet.`} />
            : <ul className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
                {filteredItems.map((entry) => (
                  <RecentlyViewedRow key={entry.entryId} entry={entry} />
                ))}
              </ul>
            }
          </TabsContent>
        </Tabs>
      }
    </div>
  );
}

function RecentlyViewedRow({ entry }: { entry: ResolvedRecentlyViewedItem }) {
  const href = getRecentlyViewedContentPath(entry.itemType, entry.item.id);
  const viewedLabel = formatRecentlyViewedAt(entry.viewedAt);

  if (entry.itemType === "song") {
    const title = getSongDisplayTitle(entry.item);
    const coverUrl = getSongCoverUrl(entry.item.imageUrl) || DEFAULT_SONG_COVER;

    return (
      <RecentlyViewedRowLayout
        href={href}
        typeLabel={TYPE_LABELS.song}
        viewedLabel={viewedLabel}
        title={title}
        subtitle={entry.item.artist}
        coverUrl={coverUrl}
      />
    );
  }

  if (entry.itemType === "sermon") {
    const coverUrl =
      getSongCoverUrl(entry.item.coverImage) || DEFAULT_SONG_COVER;

    return (
      <RecentlyViewedRowLayout
        href={href}
        typeLabel={TYPE_LABELS.sermon}
        viewedLabel={viewedLabel}
        title={entry.item.title}
        subtitle={entry.item.speaker}
        coverUrl={coverUrl}
      />
    );
  }

  const coverUrl = getSongCoverUrl(entry.item.coverImage) || DEFAULT_SONG_COVER;

  return (
    <RecentlyViewedRowLayout
      href={href}
      typeLabel={TYPE_LABELS.article}
      viewedLabel={viewedLabel}
      title={entry.item.title}
      subtitle={entry.item.author}
      coverUrl={coverUrl}
    />
  );
}

function RecentlyViewedRowLayout({
  href,
  typeLabel,
  viewedLabel,
  title,
  subtitle,
  coverUrl,
}: {
  href: string;
  typeLabel: string;
  viewedLabel: string;
  title: string;
  subtitle?: string;
  coverUrl: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex min-h-touch items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30 sm:gap-4 sm:px-5 sm:py-4"
      >
        <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border/40 bg-muted sm:size-16">
          <ImageWithFallback
            src={coverUrl}
            fallback={DEFAULT_SONG_COVER}
            alt=""
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              {typeLabel}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" aria-hidden />
              {viewedLabel}
            </span>
          </div>
          <p className="truncate font-medium">{title}</p>
          {subtitle ?
            <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
          : null}
        </div>
      </Link>
    </li>
  );
}

function RecentlyViewedListSkeleton() {
  return (
    <div className="space-y-3 overflow-hidden rounded-2xl border border-border/50 bg-card p-2 shadow-sm">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4",
            index > 0 && "border-t border-border/40"
          )}
        >
          <div className="size-14 shrink-0 animate-pulse rounded-lg bg-muted sm:size-16" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-16 text-center">
      <Clock className="mx-auto size-8 text-muted-foreground/60" />
      <p className="mt-4 text-sm font-medium">Nothing viewed yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Open songs, sermons, or articles and they will appear here.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href="/songs">Browse Songs</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href="/sermons">Browse Sermons</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href="/articles">Browse Articles</Link>
        </Button>
      </div>
    </div>
  );
}

function EmptyTab({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 px-6 py-12 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
