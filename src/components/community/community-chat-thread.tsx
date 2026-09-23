"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, X } from "lucide-react";

import type {
  CommunityChatMessage,
  CommunityReactionType,
} from "@/types/community-chat";
import { CommunityChatComposer } from "@/components/community/community-chat-composer";
import {
  formatCommunityTime,
  shouldGroupCommunityMessages,
} from "@/components/community/community-chat-format";
import { CommunityChatMessageRow } from "@/components/community/community-chat-message";
import { Button } from "@/components/ui/button";
import { fetchCommunityThread } from "@/lib/community-chat-client";

type CommunityChatThreadPanelProps = {
  churchId: string;
  currentUserId: string;
  rootId: string;
  canChat: boolean;
  getToken: () => Promise<string | null>;
  editingId: string | null;
  editPending: boolean;
  onClose: () => void;
  onReply: (message: CommunityChatMessage) => void;
  onOpenThread: (message: CommunityChatMessage) => void;
  onReact: (message: CommunityChatMessage, type: CommunityReactionType) => void;
  onEdit: (message: CommunityChatMessage) => void;
  onSaveEdit: (message: CommunityChatMessage, content: string) => void;
  onCancelEdit: () => void;
  onDelete: (message: CommunityChatMessage) => void;
  onReport: (message: CommunityChatMessage) => void;
  onSendReply: (content: string) => void;
  replyPending: boolean;
};

export function CommunityChatThreadPanel({
  churchId,
  currentUserId,
  rootId,
  canChat,
  getToken,
  editingId,
  editPending,
  onClose,
  onReply,
  onOpenThread,
  onReact,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onReport,
  onSendReply,
  replyPending,
}: CommunityChatThreadPanelProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");

  const query = useQuery({
    queryKey: ["community-chat-thread", churchId, rootId],
    enabled: Boolean(rootId),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Sign in to view this thread.");
      return fetchCommunityThread(rootId, token);
    },
  });

  const root = query.data?.root;
  const replies = query.data?.replies ?? [];

  useLayoutEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [replies.length, replyPending]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canSubmit = Boolean(draft.trim()) && !replyPending && canChat;

  function submit() {
    if (!canSubmit) return;
    onSendReply(draft);
    setDraft("");
  }

  const rowProps = {
    onReply,
    onOpenThread,
    onReact,
    onEdit,
    onSaveEdit,
    onCancelEdit,
    onDelete,
    onReport,
  };

  return (
    <section
      aria-label="Thread"
      className="absolute inset-0 z-20 flex flex-col bg-background lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[25rem] lg:border-l lg:border-[#E6E8EC] lg:shadow-[-12px_0_32px_-16px_rgba(15,23,42,0.18)]"
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-[#E6E8EC] px-3 py-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 lg:hidden"
          aria-label="Close thread"
          onClick={onClose}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm font-semibold text-[#0F172A]">Thread</p>
          <p className="text-xs text-[#64748B]">
            {root?.replyCount
              ? `${root.replyCount} ${root.replyCount === 1 ? "reply" : "replies"}`
              : "Conversation"}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="hidden size-8 lg:inline-flex"
          aria-label="Close thread"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </header>
      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {query.isLoading ?
          <div className="flex justify-center py-10">
            <Loader2 className="size-5 animate-spin text-[#64748B]" />
          </div>
        : query.isError ?
          <p className="px-2 py-6 text-center text-sm text-[#64748B]">
            Could not load this thread.
          </p>
        : root ?
          <>
            <ol className="flex flex-col">
              <CommunityChatMessageRow
                message={root}
                compact
                inThread
                isThreadAnchor
                isMine={Boolean(currentUserId) && root.userId === currentUserId}
                grouped={false}
                groupContinues={false}
                timestamp={formatCommunityTime(root.createdAt)}
                editing={editingId === root.id}
                editPending={editPending}
                {...rowProps}
              />
            </ol>
            <ol className="mt-1 flex flex-col">
              {replies.map((message, index) => (
                <CommunityChatMessageRow
                  key={message.id}
                  message={message}
                  compact
                  inThread
                  isMine={
                    Boolean(currentUserId) && message.userId === currentUserId
                  }
                  grouped={shouldGroupCommunityMessages(message, replies[index - 1])}
                  groupContinues={shouldGroupCommunityMessages(
                    replies[index + 1],
                    message
                  )}
                  timestamp={formatCommunityTime(message.createdAt)}
                  editing={editingId === message.id}
                  editPending={editPending}
                  {...rowProps}
                />
              ))}
            </ol>
          </>
        : null}
      </div>
      {canChat ?
        <div className="shrink-0 border-t border-[#E6E8EC] bg-background px-3 py-3">
          <CommunityChatComposer
            id="community-thread-reply"
            label="Reply to thread"
            draft={draft}
            placeholder="Reply to thread…"
            disabled={replyPending}
            canSubmit={canSubmit}
            pending={replyPending}
            onDraftChange={setDraft}
            onSubmit={submit}
          />
        </div>
      : null}
    </section>
  );
}
