import React from "react";

import { ProtectedContentLink } from "@/components/auth/protected-content-link";
import { AdminQuickEditButton } from "@/components/admin/admin-quick-edit-button";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import type { FirebaseSermon } from "@/types/firebase-sermon";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_SONG_COVER } from "@/config/site";
import { formatContentDate } from "@/lib/content-date";
import { cn, getSongCoverUrl } from "@/lib/utils";

type FirebaseSermonCardProps = {
  sermon: FirebaseSermon;
  className?: string;
};

export const FirebaseSermonCard = React.memo(function FirebaseSermonCard({
  sermon,
  className,
}: FirebaseSermonCardProps) {
  if (!sermon.id?.trim()) return null;

  const href = `/sermons/${encodeURIComponent(sermon.id)}`;
  const coverUrl = getSongCoverUrl(sermon.coverImage);
  const scripture = sermon.scriptureReference.trim();
  const excerpt = sermon.shortDescription || sermon.subtitle;

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card/40 text-left transition-all duration-200 hover:-translate-y-1 hover:border-border/80 hover:bg-card/60 hover:shadow-lg hover:shadow-black/20",
        className
      )}
    >
      <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-muted">
        <ProtectedContentLink href={href} className="block size-full">
          <ImageWithFallback
            src={coverUrl}
            fallback={DEFAULT_SONG_COVER}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            alt={sermon.title}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </ProtectedContentLink>

        {scripture ?
          <Badge
            variant="secondary"
            className="pointer-events-none absolute left-3 top-3 rounded-md border-0 bg-background/85 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-sm backdrop-blur-sm"
          >
            {scripture}
          </Badge>
        : null}

        <FavoriteButton
          itemType="sermon"
          itemId={sermon.id}
          className="absolute right-3 top-3 z-10"
        />

        <AdminQuickEditButton
          href={`/dashboard/content?tab=sermons&edit=${encodeURIComponent(sermon.id)}`}
          label="Edit sermon"
          className="absolute bottom-3 right-3 z-10 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        />
      </div>

      <ProtectedContentLink
        href={href}
        className="flex flex-1 flex-col gap-2 p-4 text-left"
      >
        <h3 className="line-clamp-2 text-left text-base font-semibold leading-snug text-foreground">
          {sermon.title}
        </h3>

        {sermon.speaker ?
          <p className="text-left text-xs font-medium text-muted-foreground">
            {sermon.speaker}
          </p>
        : null}

        {excerpt ?
          <p className="line-clamp-2 text-left text-sm leading-relaxed text-muted-foreground">
            {excerpt}
          </p>
        : null}

        <div className="mt-auto flex items-center gap-2 pt-3 text-left">
          <time
            dateTime={new Date(sermon.dateCreated).toISOString()}
            className="shrink-0 text-xs text-muted-foreground/80"
          >
            {formatContentDate(sermon.dateCreated)}
          </time>
        </div>
      </ProtectedContentLink>
    </article>
  );
});
