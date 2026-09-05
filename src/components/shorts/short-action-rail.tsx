"use client";

import React from "react";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

import type { VideoShort } from "@/types/video-short";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { MAX_SHORT_THUMBNAIL_BYTES } from "@/types/video-short";
import {
  deleteShort,
  reportShort,
  updateShortCover,
  uploadShortFile,
} from "@/lib/shorts-client";

type ShortActionRailProps = {
  short: VideoShort;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  onLike: () => void;
  onComments: () => void;
  canManage: boolean;
  getToken: () => Promise<string | null>;
  onDeleted?: () => void;
  onCoverUpdated?: (thumbnailUrl: string | null) => void;
};

function ActionButton({
  label,
  activeLabel,
  active,
  count,
  onClick,
  children,
}: {
  label: string;
  activeLabel?: string;
  active?: boolean;
  count?: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const [animating, setAnimating] = React.useState(false);

  function handleClick() {
    setAnimating(true);
    window.setTimeout(() => setAnimating(false), 180);
    onClick();
  }

  return (
    <button
      type="button"
      aria-label={active && activeLabel ? activeLabel : label}
      onClick={handleClick}
      className="app-interactive group flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-full transition-colors hover-hover:hover:bg-muted/40 active:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-full transition-transform duration-150",
          animating && "scale-[1.12]",
          active && "text-red-500 dark:text-red-400"
        )}
      >
        {children}
      </span>
      {count !== undefined ?
        <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
          {count}
        </span>
      : null}
    </button>
  );
}

export function ShortActionRail({
  short,
  liked,
  likeCount,
  commentCount,
  onLike,
  onComments,
  canManage,
  getToken,
  onDeleted,
  onCoverUpdated,
}: ShortActionRailProps) {
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const coverInputRef = React.useRef<HTMLInputElement>(null);

  async function handleShare() {
    const url = `${window.location.origin}/shorts?short=${short.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "FaithConnectHub Short", url });
        return;
      } catch {
        // fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link.");
    }
  }

  async function handleReport() {
    const token = await getToken();
    if (!token) {
      toast.error("Sign in to report Shorts.");
      return;
    }
    try {
      await reportShort(short.id, "Inappropriate content", token);
      toast.success("Report submitted. Thank you.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Report failed.");
    }
  }

  async function handleReplaceCover(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (coverInputRef.current) coverInputRef.current.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Cover image must be JPG, PNG, or WebP.");
      return;
    }
    if (file.size > MAX_SHORT_THUMBNAIL_BYTES) {
      toast.error("Cover image must be 2 MB or smaller.");
      return;
    }

    const token = await getToken();
    if (!token) {
      toast.error("Sign in to update the cover image.");
      return;
    }

    setBusy(true);
    try {
      const url = await uploadShortFile(short.id, "thumbnail", file, token);
      onCoverUpdated?.(url);
      toast.success("Cover image updated.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `Cover image upload failed: ${error.message}`
          : "Cover image upload failed. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveCover() {
    const token = await getToken();
    if (!token) {
      toast.error("Sign in to update the cover image.");
      return;
    }

    setBusy(true);
    try {
      await updateShortCover(short.id, null, token);
      onCoverUpdated?.(null);
      toast.success("Cover image removed.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not remove cover image."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    const token = await getToken();
    if (!token) return;
    setBusy(true);
    try {
      await deleteShort(short.id, token);
      toast.success("Short deleted.");
      onDeleted?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  return (
    <>
      <div className="flex flex-col items-center gap-1.5">
        <ActionButton
          label="Like Short"
          activeLabel="Unlike Short"
          active={liked}
          count={likeCount}
          onClick={onLike}
        >
          <Heart className={cn("size-6", liked && "fill-current")} />
        </ActionButton>

        <ActionButton
          label="Open comments"
          count={commentCount}
          onClick={onComments}
        >
          <MessageCircle className="size-6" />
        </ActionButton>

        <ActionButton label="Share Short" onClick={() => void handleShare()}>
          <Share2 className="size-6" />
        </ActionButton>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="More options"
              className="app-interactive flex min-h-11 min-w-11 flex-col items-center justify-center rounded-full transition-colors hover-hover:hover:bg-muted/40 active:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <span className="flex size-10 items-center justify-center">
                <MoreHorizontal className="size-6" />
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => void handleShare()}>
              Copy link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void handleReport()}>
              Report Short
            </DropdownMenuItem>
            {canManage ?
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={busy}
                  onSelect={(event) => {
                    event.preventDefault();
                    coverInputRef.current?.click();
                  }}
                >
                  Change cover image
                </DropdownMenuItem>
                {short.thumbnailUrl ?
                  <DropdownMenuItem
                    disabled={busy}
                    onClick={() => void handleRemoveCover()}
                  >
                    Remove cover image
                  </DropdownMenuItem>
                : null}
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  disabled={busy}
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete Short
                </DropdownMenuItem>
              </>
            : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <input
        ref={coverInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => void handleReplaceCover(event)}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this Short?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The video will be removed from your church feed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={() => void handleDelete()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
