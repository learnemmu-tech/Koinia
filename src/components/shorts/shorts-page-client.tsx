"use client";

import React from "react";
import { Plus, Video } from "lucide-react";
import { toast } from "sonner";

import type { VideoShort } from "@/types/video-short";
import type { ShortsFeedFilter } from "@/types/video-short";
import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useContentAuthDialog } from "@/context/content-auth-dialog-context";
import { ShortFeedItem } from "@/components/shorts/short-feed-item";
import { ShortCommentsSheet } from "@/components/shorts/short-comments-sheet";
import { CreateShortSheet } from "@/components/shorts/create-short-sheet";
import { fetchShortsFeed, toggleShortLike } from "@/lib/shorts-client";
import { cn } from "@/lib/utils";

type ShortsPageClientProps = {
  initialShorts: VideoShort[];
  churchName?: string;
  canPost: boolean;
};

export function ShortsPageClient({
  initialShorts,
  churchName,
  canPost,
}: ShortsPageClientProps) {
  const { user } = useFirebaseAuth();
  const { openDialog } = useContentAuthDialog();
  const [shorts, setShorts] = React.useState(initialShorts);
  const [filter, setFilter] = React.useState<ShortsFeedFilter>("church");
  const [activeId, setActiveId] = React.useState<string | null>(
    initialShorts[0]?.id ?? null
  );
  const [likes, setLikes] = React.useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const short of initialShorts) {
      map[short.id] = Boolean(short.likedByMe);
    }
    return map;
  });
  const [counts, setCounts] = React.useState<
    Record<string, { likes: number; comments: number }>
  >(() => {
    const map: Record<string, { likes: number; comments: number }> = {};
    for (const short of initialShorts) {
      map[short.id] = { likes: short.likeCount, comments: short.commentCount };
    }
    return map;
  });
  const [commentsShortId, setCommentsShortId] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [filterLoading, setFilterLoading] = React.useState(false);
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const itemRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());
  const authSyncedRef = React.useRef(false);
  const activeIdRef = React.useRef(activeId);

  React.useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const getToken = React.useCallback(async () => {
    if (!user) return null;
    return user.getIdToken();
  }, [user]);

  const mergeFeedInteractionState = React.useCallback((items: VideoShort[]) => {
    setLikes((prev) => {
      const next = { ...prev };
      for (const item of items) {
        next[item.id] = Boolean(item.likedByMe);
      }
      return next;
    });
    setCounts((prev) => {
      const next = { ...prev };
      for (const item of items) {
        next[item.id] = {
          likes: item.likeCount,
          comments: item.commentCount,
        };
      }
      return next;
    });
    setShorts((prev) => {
      const freshById = new Map(items.map((item) => [item.id, item]));
      if (prev.length === 0) return items;
      const merged = prev
        .map((short) => {
          const fresh = freshById.get(short.id);
          if (!fresh) return null;
          return {
            ...short,
            likedByMe: fresh.likedByMe,
            canManage: fresh.canManage,
            likeCount: fresh.likeCount,
            commentCount: fresh.commentCount,
          };
        })
        .filter(Boolean) as VideoShort[];
      if (merged.length === prev.length) return merged;
      return items;
    });
  }, []);

  /** Sync liked/canManage once when auth becomes available — no full-page reload. */
  React.useEffect(() => {
    if (!user || authSyncedRef.current) return;

    authSyncedRef.current = true;
    void (async () => {
      try {
        const token = await getToken();
        const items = await fetchShortsFeed(filter, token ?? undefined);
        mergeFeedInteractionState(items);
      } catch {
        authSyncedRef.current = false;
      }
    })();
  }, [user, filter, getToken, mergeFeedInteractionState]);

  const reloadFeed = React.useCallback(
    async (nextFilter: ShortsFeedFilter) => {
      setFilterLoading(true);
      try {
        const token = await getToken();
        const items = await fetchShortsFeed(nextFilter, token ?? undefined);
        const currentActive = activeIdRef.current;
        setShorts(items);
        setActiveId(
          currentActive && items.some((item) => item.id === currentActive) ?
            currentActive
          : items[0]?.id ?? null
        );
        setLikes(
          Object.fromEntries(items.map((item) => [item.id, Boolean(item.likedByMe)]))
        );
        setCounts(
          Object.fromEntries(
            items.map((item) => [
              item.id,
              { likes: item.likeCount, comments: item.commentCount },
            ])
          )
        );
      } finally {
        setFilterLoading(false);
      }
    },
    [getToken]
  );

  const shortIdsKey = React.useMemo(
    () => shorts.map((short) => short.id).join("|"),
    [shorts]
  );

  React.useEffect(() => {
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.55)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = visible?.target.getAttribute("data-short-id");
        if (id) setActiveId(id);
      },
      { threshold: [0.35, 0.55, 0.75], rootMargin: "-8% 0px" }
    );

    for (const node of itemRefs.current.values()) {
      observerRef.current.observe(node);
    }

    return () => observerRef.current?.disconnect();
  }, [shortIdsKey]);

  const handleLike = React.useCallback(
    async (shortId: string) => {
      const token = await getToken();
      if (!token) {
        openDialog(`/shorts?short=${encodeURIComponent(shortId)}`, {
          redirectOnClose: false,
        });
        return;
      }

      const wasLiked = likes[shortId] ?? false;
      const previousCount = counts[shortId]?.likes ?? 0;

      setLikes((prev) => ({ ...prev, [shortId]: !wasLiked }));
      setCounts((prev) => ({
        ...prev,
        [shortId]: {
          likes: Math.max(0, previousCount + (wasLiked ? -1 : 1)),
          comments: prev[shortId]?.comments ?? 0,
        },
      }));

      try {
        const result = await toggleShortLike(shortId, token);
        setLikes((prev) => ({ ...prev, [shortId]: result.liked }));
        setCounts((prev) => ({
          ...prev,
          [shortId]: {
            likes: result.likeCount,
            comments: prev[shortId]?.comments ?? 0,
          },
        }));
      } catch {
        setLikes((prev) => ({ ...prev, [shortId]: wasLiked }));
        setCounts((prev) => ({
          ...prev,
          [shortId]: {
            likes: previousCount,
            comments: prev[shortId]?.comments ?? 0,
          },
        }));
        toast.error("Couldn't like this Short. Try again.");
      }
    },
    [counts, getToken, likes, openDialog]
  );

  const handleCommentsOpen = React.useCallback((shortId: string) => {
    setCommentsShortId(shortId);
  }, []);

  const handleCoverUpdated = React.useCallback(
    (shortId: string, thumbnailUrl: string | null) => {
      setShorts((prev) =>
        prev.map((item) =>
          item.id === shortId ? { ...item, thumbnailUrl } : item
        )
      );
    },
    []
  );

  const handleDeleted = React.useCallback((shortId: string) => {
    setShorts((prev) => {
      const remaining = prev.filter((item) => item.id !== shortId);
      if (activeIdRef.current === shortId) {
        setActiveId(remaining[0]?.id ?? null);
      }
      return remaining;
    });
  }, []);

  const handleCommentAdded = React.useCallback((shortId: string) => {
    setCounts((prev) => ({
      ...prev,
      [shortId]: {
        likes: prev[shortId]?.likes ?? 0,
        comments: (prev[shortId]?.comments ?? 0) + 1,
      },
    }));
  }, []);

  const filters: { id: ShortsFeedFilter; label: string }[] = [
    { id: "church", label: "My Church" },
    { id: "latest", label: "Latest" },
  ];

  return (
    <div className="relative min-h-[calc(100dvh-4rem)] bg-background">
      <div className="sticky top-0 z-20 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Video className="size-4 shrink-0 text-primary" aria-hidden />
              <h1 className="truncate font-heading text-lg font-semibold text-foreground">
                Shorts
              </h1>
              {filterLoading ?
                <span className="text-xs text-muted-foreground">Updating…</span>
              : null}
            </div>
            {churchName ?
              <p className="truncate text-xs text-muted-foreground">{churchName}</p>
            : null}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1 rounded-full border border-border bg-card p-1 sm:flex">
              {filters.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={filterLoading}
                  onClick={() => {
                    if (item.id === filter) return;
                    setFilter(item.id);
                    void reloadFeed(item.id);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    filter === item.id ?
                      "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {canPost ?
              <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Create</span>
              </Button>
            : null}
          </div>
        </div>
      </div>

      {shorts.length === 0 ?
        <div className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted">
            <Video className="size-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No Shorts yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Be the first to share a moment of faith, worship, or encouragement.
          </p>
          {canPost ?
            <Button className="mt-6" onClick={() => setCreateOpen(true)}>
              Create a Short
            </Button>
          : null}
        </div>
      : <div className="mx-auto max-w-lg snap-y snap-mandatory overflow-y-auto scroll-smooth pb-6">
          {shorts.map((short) => (
            <ShortFeedItem
              key={short.id}
              short={short}
              active={activeId === short.id}
              liked={likes[short.id] ?? false}
              likeCount={counts[short.id]?.likes ?? short.likeCount}
              commentCount={counts[short.id]?.comments ?? short.commentCount}
              canManage={Boolean(short.canManage)}
              onLike={() => void handleLike(short.id)}
              onComments={() => handleCommentsOpen(short.id)}
              getToken={getToken}
              onDeleted={() => handleDeleted(short.id)}
              onCoverUpdated={(thumbnailUrl) =>
                handleCoverUpdated(short.id, thumbnailUrl)
              }
              itemRef={(node) => {
                if (node) itemRefs.current.set(short.id, node);
                else itemRefs.current.delete(short.id);
              }}
            />
          ))}
        </div>
      }

      <ShortCommentsSheet
        shortId={commentsShortId}
        open={Boolean(commentsShortId)}
        onOpenChange={(open) => {
          if (!open) setCommentsShortId(null);
        }}
        getToken={getToken}
        onCommentAdded={handleCommentAdded}
      />

      <CreateShortSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        getToken={getToken}
        onPublished={() => void reloadFeed(filter)}
      />
    </div>
  );
}
