"use client";

import { useState } from "react";
import { Check, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import type { VideoShort } from "@/types/video-short";
import { parseShortCaption } from "@/lib/short-caption";
import { deleteShort, moderateShort } from "@/lib/shorts-client";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { DEFAULT_SONG_COVER } from "@/config/site";
import { Button } from "@/components/ui/button";
import { ShortVideoPlayer } from "@/components/shorts/short-video-player";

type PendingShortsReviewProps = {
  shorts: VideoShort[];
  getToken: (forceRefresh?: boolean) => Promise<string | null>;
  onChanged: () => void;
};

export function PendingShortsReview({
  shorts,
  getToken,
  onChanged,
}: PendingShortsReviewProps) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const preview = shorts.find((item) => item.id === previewId) ?? null;

  async function run(action: "approve" | "reject" | "delete", shortId: string) {
    const token = await getToken(true);
    if (!token) {
      toast.error("Sign in to review Shorts.");
      return;
    }
    try {
      if (action === "delete") {
        await deleteShort(shortId, token);
        toast.success("Short deleted.");
      } else {
        await moderateShort(shortId, action, token);
        toast.success(action === "approve" ? "Short approved." : "Short rejected.");
      }
      setPreviewId((current) => (current === shortId ? null : current));
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Review failed.");
    }
  }

  if (shorts.length === 0) return null;

  return (
    <section className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">
          Pending Review ({shorts.length})
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {shorts.map((short) => {
          const parsed = parseShortCaption(short.caption, short.category);
          const title = parsed.title || short.caption || "Untitled Short";
          return (
            <div key={short.id} className="space-y-2">
              <button
                type="button"
                onClick={() => setPreviewId(short.id)}
                className="relative aspect-[9/16] w-full overflow-hidden rounded-lg bg-muted"
              >
                <ImageWithFallback
                  src={short.thumbnailUrl || DEFAULT_SONG_COVER}
                  fallback={DEFAULT_SONG_COVER}
                  fill
                  sizes="160px"
                  alt={title}
                  className="object-cover"
                />
              </button>
              <p className="line-clamp-2 text-xs font-medium">{title}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {short.creator.displayName}
              </p>
              <div className="flex flex-wrap gap-1">
                <Button
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => void run("approve", short.id)}
                >
                  <Check className="size-3" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => void run("reject", short.id)}
                >
                  <X className="size-3" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[11px] text-destructive"
                  onClick={() => void run("delete", short.id)}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      {preview?.videoUrl ?
        <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-xl">
          <ShortVideoPlayer
            src={preview.videoUrl}
            poster={preview.thumbnailUrl}
            active
            muted={false}
            className="aspect-[9/16] w-full"
          />
        </div>
      : null}
    </section>
  );
}
