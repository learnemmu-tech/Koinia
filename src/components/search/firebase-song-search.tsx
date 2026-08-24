"use client";

import React from "react";
import { Loader2, ChevronRight } from "lucide-react";

import type { FirebaseSong } from "@/types/firebase-song";

import { ProtectedContentLink } from "@/components/auth/protected-content-link";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { useContentTenantScope } from "@/hooks/use-workspace-tenant-scope";
import { searchSongs } from "@/lib/firebase-queries";
import { getSongAlternateTitle, getSongDisplayTitle } from "@/lib/song-firestore";
import { DEFAULT_SONG_COVER } from "@/config/site";
import { cn, getSongCoverUrl } from "@/lib/utils";

type FirebaseSongSearchProps = {
  query: string;
};

export function FirebaseSongSearch({ query }: FirebaseSongSearchProps) {
  const [songs, setSongs] = React.useState<FirebaseSong[]>([]);
  const [loading, setLoading] = React.useState(false);
  const scope = useContentTenantScope();

  React.useEffect(() => {
    (async () => {
      if (!query.trim()) {
        setSongs([]);
        setLoading(false);
        return;
      }

      if (scope.blocked) {
        setSongs([]);
        setLoading(scope.isLoading);
        return;
      }

      setLoading(true);
      try {
        const results = await searchSongs(scope, query);
        setSongs(results);
      } catch {
        setSongs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [scope.blocked, scope.isLoading, scope.branchId, scope.churchId, scope.organizationId, query]);

  if (!query.trim()) return null;

  if (loading) {
    return (
      <div className="py-4 text-center text-xs text-muted-foreground">
        <Loader2 className="mr-2 inline-block size-4 animate-spin" />
        Searching library...
      </div>
    );
  }

  if (songs.length === 0) return null;

  return (
    <div className="space-y-3 py-4 w-full">
      <p className="font-heading text-lg font-semibold">From Your Library</p>

      {/* Scrollable results container — VERTICAL LIST */}
      <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-2 w-full">
        {songs.map((song) => {
          const displayTitle = getSongDisplayTitle(song);
          const alternateTitle = getSongAlternateTitle(song);
          const songHref = `/songs/${encodeURIComponent(song.id)}`;
          const coverUrl = getSongCoverUrl(song.imageUrl);

          return (
            <ProtectedContentLink
              key={song.id}
              href={songHref}
              className={cn(
                "group relative flex items-center w-full gap-3 overflow-hidden rounded-lg border border-border/50 bg-card/40 px-3 py-2.5 transition-all duration-200",
                "hover:border-border/80 hover:bg-card/60 hover:shadow-sm flex-shrink-0"
              )}
            >
              {/* Cover art — left side */}
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md">
                <ImageWithFallback
                  src={coverUrl}
                  fallback={DEFAULT_SONG_COVER}
                  width={80}
                  height={80}
                  sizes="80px"
                  alt={displayTitle}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                {/* Play icon on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 shadow-md">
                    <svg className="h-3 w-3 translate-x-0.5 text-primary" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M3 2.5a.5.5 0 0 1 .765-.424l10 5.5a.5.5 0 0 1 0 .848l-10 5.5A.5.5 0 0 1 3 13.5v-11z" />
                    </svg>
                  </div>
                </div>

                {/* YouTube badge */}
                {song.youtubeUrl?.trim() ? (
                  <span className="absolute top-0.5 right-0.5 z-10 flex items-center gap-0.5 rounded-full bg-red-600 px-1 py-0 text-[8px] font-bold uppercase tracking-wide text-white shadow-sm">
                    <svg className="h-1.5 w-1.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    YT
                  </span>
                ) : null}
              </div>

              {/* Text content — middle */}
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                {/* English title — primary */}
                <h3 className="line-clamp-2 text-sm font-bold leading-tight text-foreground transition-colors duration-200 group-hover:text-primary">
                  {displayTitle}
                </h3>

                {alternateTitle ? (
                  <p className="line-clamp-1 text-xs leading-tight text-muted-foreground">
                    {alternateTitle}
                  </p>
                ) : null}
              </div>

              {/* Right arrow — indicator */}
              <div className="ml-auto shrink-0 text-muted-foreground transition-all duration-200 group-hover:text-primary group-hover:translate-x-0.5">
                <ChevronRight className="h-5 w-5" />
              </div>
            </ProtectedContentLink>
          );
        })}
      </div>
    </div>
  );
}
