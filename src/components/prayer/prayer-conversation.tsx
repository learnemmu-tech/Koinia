"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, Loader2, MoreHorizontal, Reply, Send, Pencil, Trash2, Flag } from "lucide-react";
import { toast } from "sonner";

import { AuthorAvatar } from "@/components/author-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { firebaseAuth } from "@/lib/firebase-auth-service";
import { formatRelativeTime } from "@/lib/format-relative-time";

type ResponseItem = {
  id: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  likedByMe: boolean;
};

type ConversationProps = { requestId: string };

export function PrayerConversation({ requestId }: ConversationProps) {
  const { authUser } = useFirebaseAuth();
  const [items, setItems] = useState<ResponseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [content, setContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<ResponseItem | null>(null);
  const [editing, setEditing] = useState<ResponseItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function request(path: string, init?: RequestInit) {
    const user = firebaseAuth.currentUser;
    if (!user) throw new Error("Please sign in to join the conversation.");
    const token = await user.getIdToken();
    const response = await fetch(path, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Conversation request failed.");
    return data;
  }

  async function load() {
    try {
      const data = await request(`/api/prayer-requests/${encodeURIComponent(requestId)}/responses`);
      setItems((data.responses as ResponseItem[]) ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Responses unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authUser) void load();
    else setLoading(false);
  }, [authUser, requestId]);

  const children = useMemo(() => {
    const map = new Map<string | null, ResponseItem[]>();
    for (const item of items) {
      const list = map.get(item.parentId) ?? [];
      list.push(item);
      map.set(item.parentId, list);
    }
    return map;
  }, [items]);

  function openComposer(response?: ResponseItem) {
    setReplyingTo(response ?? null);
    setEditing(null);
    setComposerOpen(true);
  }

  async function submit() {
    const value = content.trim();
    if (!value || submitting) return;
    setSubmitting(true);
    try {
      if (editing) {
        await request(`/api/prayer-requests/${encodeURIComponent(requestId)}/responses?responseId=${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify({ content: value }),
        });
      } else {
        await request(`/api/prayer-requests/${encodeURIComponent(requestId)}/responses`, {
          method: "POST",
          body: JSON.stringify({ content: value, parentId: replyingTo?.id ?? null }),
        });
      }
      setContent("");
      setComposerOpen(false);
      setReplyingTo(null);
      setEditing(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save response.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleLike(item: ResponseItem) {
    try {
      const data = await request(`/api/prayer-requests/${encodeURIComponent(requestId)}/responses`, {
        method: "PUT",
        body: JSON.stringify({ action: "like", responseId: item.id }),
      });
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, likedByMe: Boolean(data.liked), likeCount: Number(data.likeCount ?? entry.likeCount) } : entry));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update like.");
    }
  }

  async function remove(item: ResponseItem) {
    try {
      await request(`/api/prayer-requests/${encodeURIComponent(requestId)}/responses?responseId=${item.id}`, { method: "DELETE" });
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete response.");
    }
  }

  async function report(item: ResponseItem) {
    try {
      await request(`/api/prayer-requests/${encodeURIComponent(requestId)}/responses`, {
        method: "PUT",
        body: JSON.stringify({ action: "report", responseId: item.id }),
      });
      toast.success("Response reported. Thank you.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to report response.");
    }
  }

  function beginEdit(item: ResponseItem) {
    setEditing(item);
    setReplyingTo(null);
    setContent(item.content);
    setComposerOpen(true);
  }

  function renderComposer(isReply = false): React.ReactNode {
    return (
      <div className={isReply ? "mt-2 pl-1" : "mt-1"}>
        {isReply || editing ? (
          <div className="mb-1 flex items-center justify-between px-1 text-xs text-muted-foreground">
            <span>{editing ? "Editing your response" : `Replying to ${replyingTo?.authorName ?? "this response"}`}</span>
            <button
              type="button"
              className="rounded px-1.5 py-1 hover:bg-muted hover:text-foreground"
              onClick={() => {
                setReplyingTo(null);
                setEditing(null);
                setContent("");
                setComposerOpen(false);
              }}
              aria-label={editing ? "Cancel editing" : "Cancel reply"}
            >
              Cancel
            </button>
          </div>
        ) : null}
        <div className="flex items-start gap-2.5">
          <AuthorAvatar name={authUser?.displayName ?? "You"} className="size-8" />
          <div className="min-w-0 flex-1 border-b border-border/70 focus-within:border-primary/50">
            <div className="relative">
              <Textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void submit();
                  }
                }}
                maxLength={2000}
                autoFocus
                rows={1}
                placeholder={isReply ? "Write a reply..." : "Write a response..."}
                aria-label={isReply ? "Write a reply" : "Write a response"}
                className="min-h-9 resize-none border-0 bg-transparent px-0 py-2 pr-10 text-sm shadow-none focus-visible:ring-0"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute bottom-0.5 right-0 size-8 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
                disabled={!content.trim() || submitting}
                onClick={() => void submit()}
                aria-label={editing ? "Save response" : isReply ? "Send reply" : "Send response"}
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-[18px]" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderResponse(item: ResponseItem, depth = 0): React.ReactNode {
    const isOwn = item.authorId === authUser?.uid;
    return (
      <div key={item.id} className={depth > 0 ? "ml-5 border-l border-border/50 pl-3 sm:ml-8 sm:pl-4" : ""}>
        <div className="flex gap-3 py-3.5">
          <AuthorAvatar name={item.deleted ? "Deleted response" : item.authorName} className="size-8" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium leading-tight">{item.deleted ? "Deleted response" : item.authorName}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{formatRelativeTime(new Date(item.createdAt).getTime())}</p>
              </div>
              {!item.deleted ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="size-7 text-muted-foreground" aria-label="More response actions">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isOwn ? <>
                      <DropdownMenuItem onClick={() => beginEdit(item)}><Pencil className="size-4" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void remove(item)}><Trash2 className="size-4" /> Delete</DropdownMenuItem>
                    </> : <DropdownMenuItem onClick={() => void report(item)}><Flag className="size-4" /> Report</DropdownMenuItem>}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{item.content}</p>
            {!item.deleted ? <div className="mt-2.5 flex items-center gap-3 text-xs text-muted-foreground">
              <button type="button" className={item.likedByMe ? "inline-flex items-center gap-1 text-primary" : "inline-flex items-center gap-1 hover:text-foreground"} onClick={() => void toggleLike(item)} aria-label={item.likedByMe ? "Unlike response" : "Like response"}>
                <Heart className={item.likedByMe ? "size-3.5 fill-current" : "size-3.5"} /> {item.likeCount}
              </button>
              <button type="button" className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => openComposer(item)} aria-label={`Reply to ${item.authorName}`}>
                <Reply className="size-3.5" /> Reply
              </button>
            </div> : null}
            {composerOpen && replyingTo?.id === item.id ? renderComposer(true) : null}
          </div>
        </div>
        {depth < 2 ? (children.get(item.id) ?? []).map((child) => renderResponse(child, depth + 1)) : null}
      </div>
    );
  }

  return (
    <section className="space-y-1" aria-labelledby="prayer-conversation-title">
      <div className="flex items-baseline justify-between gap-3 px-1 pb-2">
        <h2 id="prayer-conversation-title" className="flex items-center gap-2 text-lg font-semibold"><Reply className="size-4 text-primary" /> Prayer Conversation</h2>
        <p className="text-xs text-muted-foreground">{items.length} {items.length === 1 ? "response" : "responses"}</p>
      </div>
      {composerOpen && !replyingTo ? renderComposer() : (
        !composerOpen ? (
          <button
            type="button"
            onClick={() => openComposer()}
            className="flex min-h-10 w-full items-center gap-2.5 px-1 text-left text-sm text-muted-foreground"
          >
            <AuthorAvatar name={authUser?.displayName ?? "You"} className="size-8" />
            <span className="min-w-0 flex-1 border-b border-border/70 py-2.5 hover:border-primary/50 hover:text-foreground">Write a response...</span>
            <Send className="size-[18px] shrink-0 text-muted-foreground/70" aria-hidden />
          </button>
        ) : null
      )}
      <div className="divide-y divide-border/50">
        {loading ? <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-primary" /></div> : items.length === 0 ? <p className="py-3 pl-11 text-xs text-muted-foreground">Be the first to encourage this community.</p> : (children.get(null) ?? []).map((item) => renderResponse(item))}
      </div>
    </section>
  );
}
