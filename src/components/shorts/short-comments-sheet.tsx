"use client";

import React from "react";
import { Loader2, Send, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import type { VideoShortComment } from "@/types/video-short";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useContentAuthDialog } from "@/context/content-auth-dialog-context";
import { fetchShortComments, postShortComment } from "@/lib/shorts-client";
import { cn } from "@/lib/utils";

type ShortCommentsSheetProps = {
  shortId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  getToken: () => Promise<string | null>;
  onCommentAdded?: (shortId: string) => void;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

function CommentSkeleton() {
  return (
    <div className="space-y-3 py-2">
      {[0, 1, 2].map((key) => (
        <div key={key} className="flex animate-pulse gap-3">
          <div className="size-8 shrink-0 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-3 w-full max-w-[220px] rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ShortCommentsSheet({
  shortId,
  open,
  onOpenChange,
  getToken,
  onCommentAdded,
}: ShortCommentsSheetProps) {
  const isDesktop = useIsDesktop();
  const { authUser, profile } = useFirebaseAuth();
  const { openDialog } = useContentAuthDialog();
  const [comments, setComments] = React.useState<VideoShortComment[]>([]);
  const [body, setBody] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [posting, setPosting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !shortId) {
      setComments([]);
      setBody("");
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetchShortComments(shortId)
      .then((items) => {
        if (!cancelled) setComments(items);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load comments.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, shortId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!shortId || !body.trim()) return;

    const token = await getToken();
    if (!token) {
      openDialog(
        shortId ? `/shorts?short=${encodeURIComponent(shortId)}` : "/shorts",
        { redirectOnClose: false }
      );
      return;
    }

    const trimmed = body.trim();
    const displayName =
      [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim() ||
      authUser?.displayName ||
      profile?.email ||
      authUser?.email ||
      "You";

    const optimistic: VideoShortComment = {
      id: `optimistic-${Date.now()}`,
      shortId,
      userId: profile?.email ?? "me",
      body: trimmed,
      createdAt: new Date().toISOString(),
      creator: {
        id: profile?.email ?? "me",
        firstName: profile?.firstName ?? "",
        lastName: profile?.lastName ?? "",
        displayName,
        photoUrl: authUser?.photoURL ?? null,
      },
    };

    setPosting(true);
    setError(null);
    setBody("");
    setComments((prev) => [optimistic, ...prev]);

    try {
      const created = await postShortComment(shortId, trimmed, token);
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === optimistic.id ?
            {
              ...comment,
              id: created.id,
              createdAt: created.createdAt,
            }
          : comment
        )
      );
      onCommentAdded?.(shortId);
    } catch (err) {
      setComments((prev) => prev.filter((comment) => comment.id !== optimistic.id));
      setBody(trimmed);
      const message =
        err instanceof Error ? err.message : "Couldn't post your comment.";
      setError(message);
      toast.error(message);
    } finally {
      setPosting(false);
    }
  }

  const panelClass = cn(
    "flex flex-col gap-0 border-border bg-background p-0 shadow-xl transition duration-200",
    isDesktop ?
      "fixed inset-y-0 right-0 z-50 h-full w-[min(100vw,380px)] max-w-[380px] border-l"
    : "fixed inset-x-0 bottom-0 z-50 !h-auto max-h-[min(58vh,520px)] rounded-t-2xl border-t"
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          panelClass,
          "[&>button.absolute]:hidden",
          !isDesktop && "!h-auto max-h-[min(58vh,520px)] min-h-[280px] rounded-t-2xl"
        )}
      >
        <SheetHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 border-b border-border/60 px-4 py-3">
          <SheetTitle className="text-base font-semibold">Comments</SheetTitle>
          <button
            type="button"
            aria-label="Close comments"
            onClick={() => onOpenChange(false)}
            className="app-interactive flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover-hover:hover:bg-muted/50 hover-hover:hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <X className="size-4" />
          </button>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {loading ?
            <CommentSkeleton />
          : error && comments.length === 0 ?
            <p className="py-6 text-center text-sm text-destructive">{error}</p>
          : comments.length === 0 ?
            <div className="flex min-h-[140px] items-center justify-center py-6 text-center">
              <div>
                <p className="text-sm font-medium text-foreground">No comments yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Be the first to encourage the community.
                </p>
              </div>
            </div>
          : <ul className="space-y-4 pb-2">
              {comments.map((comment) => (
                <li key={comment.id} className="flex gap-3">
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback className="text-[10px]">
                      {initials(comment.creator.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {comment.creator.displayName}
                      </p>
                      <time
                        className="shrink-0 text-[11px] text-muted-foreground"
                        dateTime={comment.createdAt}
                      >
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                        })}
                      </time>
                    </div>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                      {comment.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          }
        </div>

        {error && comments.length > 0 ?
          <p className="px-4 pb-1 text-xs text-destructive">{error}</p>
        : null}

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="flex shrink-0 gap-2 border-t border-border bg-background p-4"
        >
          <Input
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Add a comment…"
            maxLength={500}
            disabled={posting}
            className="h-11 rounded-[10px]"
          />
          <Button
            type="submit"
            size="icon"
            disabled={posting || !body.trim()}
            aria-label="Post comment"
            className="size-11 shrink-0 rounded-[10px]"
          >
            {posting ?
              <Loader2 className="size-4 animate-spin" />
            : <Send className="size-4" />}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
