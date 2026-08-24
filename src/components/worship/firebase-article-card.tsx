import React from "react";

import type { FirebaseArticle } from "@/types/firebase-article";

import { ProtectedContentLink } from "@/components/auth/protected-content-link";
import { AdminQuickEditButton } from "@/components/admin/admin-quick-edit-button";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_SONG_COVER } from "@/config/site";
import { formatContentDate } from "@/lib/content-date";
import { cn, getSongCoverUrl } from "@/lib/utils";

type FirebaseArticleCardProps = {
  article: FirebaseArticle;
  className?: string;
};

function getAuthorInitial(author: string): string {
  const trimmed = author.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
}

export const FirebaseArticleCard = React.memo(function FirebaseArticleCard({
  article,
  className,
}: FirebaseArticleCardProps) {
  if (!article.id?.trim()) return null;

  const href = `/articles/${encodeURIComponent(article.id)}`;
  const coverUrl = getSongCoverUrl(article.coverImage);
  const category = article.category.trim();

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
            alt={article.title}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </ProtectedContentLink>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
          {category ?
            <Badge
              variant="secondary"
              className="rounded-md border-0 bg-background/85 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-sm backdrop-blur-sm"
            >
              {category}
            </Badge>
          : null}
          {article.featured ?
            <Badge className="rounded-md border-0 bg-primary/90 px-2 py-0.5 text-[10px] font-medium text-primary-foreground shadow-sm backdrop-blur-sm">
              Featured
            </Badge>
          : null}
        </div>

        <FavoriteButton
          itemType="article"
          itemId={article.id}
          className="absolute right-3 top-3 z-10"
        />

        <AdminQuickEditButton
          href={`/dashboard/content?tab=articles&edit=${encodeURIComponent(article.id)}`}
          label="Edit article"
          className="absolute bottom-3 right-3 z-10 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        />
      </div>

      <ProtectedContentLink
        href={href}
        className="flex flex-1 flex-col gap-2 p-4 text-left"
      >
        <h3 className="line-clamp-2 text-left text-base font-semibold leading-snug text-foreground">
          {article.title}
        </h3>

        {article.shortDescription ?
          <p className="line-clamp-2 text-left text-sm leading-relaxed text-muted-foreground">
            {article.shortDescription}
          </p>
        : null}

        <div className="mt-auto flex items-center gap-2 pt-3 text-left">
          {article.author ?
            <>
              <span
                aria-hidden
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted/80 text-[10px] font-semibold uppercase text-muted-foreground"
              >
                {getAuthorInitial(article.author)}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {article.author}
              </span>
              <span aria-hidden className="shrink-0 text-xs text-muted-foreground/50">
                ·
              </span>
            </>
          : null}
          <time
            dateTime={new Date(article.dateCreated).toISOString()}
            className="shrink-0 text-xs text-muted-foreground/80"
          >
            {formatContentDate(article.dateCreated)}
          </time>
        </div>
      </ProtectedContentLink>
    </article>
  );
});
