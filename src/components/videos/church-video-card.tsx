"use client";

import { useState } from "react";
import { ExternalLink, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { ChurchVideo } from "@/types/church-video";
import { getVimeoEmbedUrl, getYouTubeEmbedUrl } from "@/lib/media-url-validation";
import { deleteChurchVideo, updateChurchVideo } from "@/lib/videos-client";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { DEFAULT_SONG_COVER } from "@/config/site";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ChurchVideoCardProps = {
  video: ChurchVideo;
  canManage?: boolean;
  getToken?: (forceRefresh?: boolean) => Promise<string | null>;
  onChanged?: () => void;
};

function embedSrc(video: ChurchVideo): string | null {
  if (video.provider === "youtube") return getYouTubeEmbedUrl(video.externalUrl);
  if (video.provider === "vimeo") return getVimeoEmbedUrl(video.externalUrl);
  return null;
}

export function ChurchVideoCard({
  video,
  canManage,
  getToken,
  onChanged,
}: ChurchVideoCardProps) {
  const [open, setOpen] = useState(false);
  const src = embedSrc(video);
  const poster = video.thumbnailUrl || DEFAULT_SONG_COVER;

  async function handleDelete() {
    if (!getToken) return;
    const token = await getToken(true);
    if (!token) return;
    try {
      await deleteChurchVideo(video.id, token);
      toast.success("Video deleted.");
      onChanged?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    }
  }

  async function handleUnpublish() {
    if (!getToken) return;
    const token = await getToken(true);
    if (!token) return;
    try {
      await updateChurchVideo(video.id, { published: !video.published }, token);
      onChanged?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
    }
  }

  return (
    <>
      <article className="app-interactive group overflow-hidden rounded-xl border border-border/50 bg-card/40">
        <button
          type="button"
          onClick={() => {
            if (src) {
              setOpen(true);
              return;
            }
            window.open(video.externalUrl, "_blank", "noopener,noreferrer");
          }}
          className="block w-full text-left"
        >
          <div className="relative aspect-video overflow-hidden bg-muted">
            <ImageWithFallback
              src={poster}
              fallback={DEFAULT_SONG_COVER}
              fill
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
              alt={video.title}
              className="object-cover"
            />
            <span className="absolute left-1/2 top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background/50 text-foreground backdrop-blur-sm">
              {src ? <Play className="ml-0.5 size-4 fill-current" /> : <ExternalLink className="size-4" />}
            </span>
            {!video.published ?
              <span className="absolute left-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium">
                Draft
              </span>
            : null}
          </div>
          <div className="space-y-1 p-3">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
              {video.title}
            </h3>
            {video.description ?
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {video.description}
              </p>
            : null}
            <p className="text-[11px] capitalize text-muted-foreground">
              {video.provider}
            </p>
          </div>
        </button>
        {canManage ?
          <div className="flex gap-2 border-t border-border/50 px-3 py-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 flex-1 text-xs"
              onClick={() => void handleUnpublish()}
            >
              {video.published ? "Unpublish" : "Publish"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-destructive"
              onClick={() => void handleDelete()}
              aria-label="Delete video"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        : null}
      </article>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl overflow-hidden p-0">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="pr-8 text-base">{video.title}</DialogTitle>
          </DialogHeader>
          {src ?
            <div className="aspect-video w-full bg-black">
              <iframe
                src={src}
                title={video.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          : null}
          <div className={cn("flex justify-end px-4 pb-4", src && "pt-0")}>
            <Button asChild variant="outline" size="sm">
              <a href={video.externalUrl} target="_blank" rel="noreferrer">
                Open original
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
