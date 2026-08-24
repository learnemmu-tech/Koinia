"use client";

import Link from "next/link";
import { Clock, Loader2 } from "lucide-react";

import { ImageWithFallback } from "@/components/image-with-fallback";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_SONG_COVER } from "@/config/site";
import { useRecentlyViewed } from "@/context/recently-viewed-context";
import { useResolvedRecentlyViewedItems } from "@/hooks/use-resolved-recently-viewed-items";
import {
  getRecentlyViewedContentPath,
  RECENTLY_VIEWED_LIMIT,
} from "@/lib/recently-viewed-firestore";
import { getSongDisplayTitle } from "@/lib/song-firestore";
import { cn, getSongCoverUrl } from "@/lib/utils";

const TYPE_LABELS = {
  song: "Song",
  sermon: "Sermon",
  article: "Article",
} as const;

export function DashboardRecentlyViewedSection() {
  const { recentlyViewed, loading: historyLoading } = useRecentlyViewed();
  const { items, loading: itemsLoading } =
    useResolvedRecentlyViewedItems(recentlyViewed);

  const loading = historyLoading || itemsLoading;

  return (
    <section className="space-y-4">
      <SectionHeader count={items.length} loading={loading} />

      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="p-5 sm:p-6">
          {loading ?
            <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-44 w-36 shrink-0 rounded-2xl sm:w-40"
                />
              ))}
            </div>
          : items.length === 0 ?
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-6 py-12 text-center">
              <Clock className="mx-auto size-8 text-muted-foreground/60" />
              <p className="mt-4 text-sm font-medium">Nothing viewed yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Open songs, sermons, or articles and they will appear here.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <BrowseLink href="/songs" label="Browse Songs" />
                <BrowseLink href="/sermons" label="Browse Sermons" />
                <BrowseLink href="/articles" label="Browse Articles" />
              </div>
            </div>
          : <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4">
              {items.map((entry) => {
                const href = getRecentlyViewedContentPath(
                  entry.itemType,
                  entry.item.id
                );
                const title =
                  entry.itemType === "song" ?
                    getSongDisplayTitle(entry.item)
                  : entry.item.title;
                const coverUrl =
                  entry.itemType === "song" ?
                    getSongCoverUrl(entry.item.imageUrl) || DEFAULT_SONG_COVER
                  : getSongCoverUrl(entry.item.coverImage) || DEFAULT_SONG_COVER;

                return (
                  <Link
                    key={`${entry.itemType}:${entry.item.id}`}
                    href={href}
                    className="group flex w-36 shrink-0 flex-col overflow-hidden rounded-2xl border border-border/50 bg-background shadow-sm transition-colors hover:bg-muted/30 sm:w-40"
                  >
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      <ImageWithFallback
                        src={coverUrl}
                        fallback={DEFAULT_SONG_COVER}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="160px"
                      />
                      <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
                        {TYPE_LABELS[entry.itemType]}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-3">
                      <p className="line-clamp-2 text-sm font-medium leading-snug">
                        {title}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          }
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  count,
  loading = false,
}: {
  count: number;
  loading?: boolean;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/60">
          Continue Exploring
        </p>
        <h2 className="font-heading text-xl font-bold sm:text-2xl">
          Recently Viewed
        </h2>
        <p className="text-sm text-muted-foreground">
          Your latest songs, sermons, and articles.
        </p>
      </div>
      <div
        className={cn(
          "shrink-0 text-sm font-semibold text-muted-foreground",
          loading && "opacity-60"
        )}
      >
        {loading ?
          <Loader2 className="size-4 animate-spin" />
        : `${count} / ${RECENTLY_VIEWED_LIMIT}`}
      </div>
    </div>
  );
}

function BrowseLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium hover:bg-muted/40"
    >
      {label}
    </Link>
  );
}
