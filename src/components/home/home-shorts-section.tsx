import Link from "next/link";
import { Heart, MessageCircle, Play } from "lucide-react";

import type { VideoShort } from "@/types/video-short";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { DEFAULT_SONG_COVER } from "@/config/site";
import { parseShortCaption } from "@/lib/short-caption";
import { cn } from "@/lib/utils";

import { HomeCollectionRail, homeRailItemClass, HOME_RAIL_PORTRAIT } from "./home-collection-rail";
import { HomeEmptyState } from "./home-empty-state";
import { HomeSectionHeader } from "./home-section-header";

type HomeShortsSectionProps = {
  shorts: VideoShort[];
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function HomeShortCard({ short }: { short: VideoShort }) {
  const href = `/shorts?short=${encodeURIComponent(short.id)}`;
  const poster = short.thumbnailUrl || DEFAULT_SONG_COVER;
  const parsed = parseShortCaption(short.caption, short.category);
  const caption = parsed.title || parsed.description || short.caption.trim();

  return (
    <Link
      href={href}
      className="app-interactive group block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div
        className={cn(
          "app-mobile-card relative aspect-[9/16] overflow-hidden rounded-xl bg-muted",
          "transition-transform duration-200 hover-hover:hover:scale-[1.02] active:scale-[0.99]"
        )}
      >
        <ImageWithFallback
          src={poster}
          fallback={DEFAULT_SONG_COVER}
          fill
          sizes="(min-width: 1280px) 200px, (min-width: 768px) 22vw, 42vw"
          alt={caption || `${short.creator.displayName} Short`}
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent transition-opacity duration-200 hover-hover:group-hover:from-background/90" />
        <span className="absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background/40 text-foreground opacity-90 backdrop-blur-sm transition-opacity duration-200 hover-hover:group-hover:opacity-100">
          <Play className="ml-0.5 size-4 fill-current" aria-hidden />
        </span>
        <div className="absolute inset-x-0 bottom-0 space-y-1 p-2.5">
          <div className="flex items-center gap-1.5">
            <Avatar className="size-5 shrink-0">
              <AvatarFallback className="text-[8px]">
                {initials(short.creator.displayName)}
              </AvatarFallback>
            </Avatar>
            <p className="truncate text-[11px] font-medium text-foreground">
              {short.creator.displayName}
            </p>
          </div>
          {caption ?
            <p className="line-clamp-2 text-[11px] leading-snug text-foreground/90">
              {caption}
            </p>
          : null}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            {short.likeCount > 0 ?
              <span className="inline-flex items-center gap-0.5">
                <Heart className="size-2.5" aria-hidden />
                {short.likeCount}
              </span>
            : null}
            {short.commentCount > 0 ?
              <span className="inline-flex items-center gap-0.5">
                <MessageCircle className="size-2.5" aria-hidden />
                {short.commentCount}
              </span>
            : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function HomeShortsSection({ shorts }: HomeShortsSectionProps) {
  const visible = shorts.filter((short) => short.videoUrl).slice(0, 5);

  return (
    <section aria-labelledby="home-shorts-heading" className="space-y-2.5">
      <HomeSectionHeader
        id="home-shorts-heading"
        title="Short Videos"
        description="Quick moments of faith, encouragement, worship, and community."
        href="/shorts"
      />
      {visible.length === 0 ?
        <HomeEmptyState
          title="Short videos coming soon"
          description="Share encouragement, worship, and moments from your church community."
        />
      : <HomeCollectionRail className="md:mx-0 md:grid md:max-w-4xl md:grid-cols-4 md:items-start md:overflow-visible md:px-0 lg:grid-cols-5">
          {visible.map((short) => (
            <div
              key={short.id}
              className={cn(homeRailItemClass(HOME_RAIL_PORTRAIT), "min-w-0")}
            >
              <HomeShortCard short={short} />
            </div>
          ))}
        </HomeCollectionRail>
      }
    </section>
  );
}
