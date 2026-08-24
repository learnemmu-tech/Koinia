"use client";

import { ChevronRight } from "lucide-react";

import { ProtectedContentLink } from "@/components/auth/protected-content-link";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { DEFAULT_SONG_COVER } from "@/config/site";
import { cn, getSongCoverUrl } from "@/lib/utils";

import { HighlightedText } from "./search-highlight";

type SearchResultRowProps = {
  href: string;
  title: string;
  subtitle?: string;
  coverUrl?: string;
  highlightQuery?: string;
};

export function SearchResultRow({
  href,
  title,
  subtitle,
  coverUrl,
  highlightQuery,
}: SearchResultRowProps) {
  const imageUrl = getSongCoverUrl(coverUrl);

  return (
    <ProtectedContentLink
      href={href}
      className={cn(
        "group relative flex w-full flex-shrink-0 items-center gap-3 overflow-hidden rounded-lg border border-border/50 bg-card/40 px-3 py-2.5 transition-all duration-200",
        "hover:border-border/80 hover:bg-card/60 hover:shadow-sm",
      )}
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md">
        <ImageWithFallback
          src={imageUrl}
          fallback={DEFAULT_SONG_COVER}
          width={64}
          height={64}
          sizes="64px"
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <h3 className="line-clamp-2 text-sm font-bold leading-tight text-foreground transition-colors duration-200 group-hover:text-primary">
          {highlightQuery ? (
            <HighlightedText text={title} query={highlightQuery} />
          ) : (
            title
          )}
        </h3>
        {subtitle ? (
          <p className="line-clamp-1 text-xs leading-tight text-muted-foreground">
            {highlightQuery ? (
              <HighlightedText text={subtitle} query={highlightQuery} />
            ) : (
              subtitle
            )}
          </p>
        ) : null}
      </div>

      <div className="ml-auto shrink-0 text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary">
        <ChevronRight className="h-5 w-5" />
      </div>
    </ProtectedContentLink>
  );
}
