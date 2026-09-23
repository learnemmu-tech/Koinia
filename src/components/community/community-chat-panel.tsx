"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

import type {
  CommunityChatMessage,
  CommunityChatThread,
  CommunityReactionType,
} from "@/types/community-chat";
import { CommunityChatComposer } from "@/components/community/community-chat-composer";
import {
  formatCommunityTime,
  shouldGroupCommunityMessages,
} from "@/components/community/community-chat-format";
import { CommunityChatMessageRow } from "@/components/community/community-chat-message";
import { CommunityChatThreadPanel } from "@/components/community/community-chat-thread";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import {
  deleteCommunityMessage,
  editCommunityMessage,
  fetchCommunityMessages,
  reportCommunityMessage,
  sendCommunityMessage,
  toggleCommunityReaction,
} from "@/lib/community-chat-client";
import { COMMUNITY_REPORT_REASONS } from "@/types/community-chat";

type CommunityChatPanelProps = {
  churchId: string;
  churchName: string;
  canChat: boolean;
  currentUserId: string;
  initialMessages: CommunityChatMessage[];
  initialHasMore: boolean;
};

type ChatCache = {
  messages: CommunityChatMessage[];
  hasMore: boolean;
};

function upsertMessage(list: CommunityChatMessage[], message: CommunityChatMessage) {
  const index = list.findIndex((item) => item.id === message.id);
  if (index === -1) return [...list, message];
  const next = [...list];
  next[index] = message;
  return next;
}

export function CommunityChatPanel({
  churchId,
  churchName,
  canChat,
  currentUserId,
  initialMessages,
  initialHasMore,
}: CommunityChatPanelProps) {
  const queryClient = useQueryClient();
  const { user } = useFirebaseAuth();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const [draft, setDraft] = useState("");
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [threadRootId, setThreadRootId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<CommunityChatMessage | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CommunityChatMessage | null>(null);
  const [reportTarget, setReportTarget] = useState<CommunityChatMessage | null>(null);
  const [reportReason, setReportReason] = useState<(typeof COMMUNITY_REPORT_REASONS)[number]>(
    COMMUNITY_REPORT_REASONS[0]
  );

  const queryKey = useMemo(
    () => ["community-chat", churchId] as const,
    [churchId]
  );

  const getToken = useCallback(async () => {
    if (!user) return null;
    return user.getIdToken(true);
  }, [user]);

  const query = useQuery({
    queryKey,
    enabled: Boolean(user && canChat && churchId),
    initialData:
      initialMessages.length > 0
        ? { messages: initialMessages, hasMore: initialHasMore }
        : undefined,
    staleTime: 15_000,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Sign in to view this conversation.");
      return fetchCommunityMessages(token);
    },
  });

  const messages = query.data?.messages ?? initialMessages;

  useEffect(() => {
    if (query.data?.hasMore !== undefined) {
      setHasMore(query.data.hasMore);
    }
  }, [query.data?.hasMore]);

  function patchMessage(message: CommunityChatMessage) {
    queryClient.setQueryData<ChatCache>(queryKey, (current) => {
      const existing = current?.messages ?? messages;
      if (message.replyTo) {
        return {
          messages: existing.map((item) =>
            item.id === message.id ? message : item
          ),
          hasMore: current?.hasMore ?? hasMore,
        };
      }
      return {
        messages: upsertMessage(existing, message),
        hasMore: current?.hasMore ?? hasMore,
      };
    });

    queryClient.setQueriesData<CommunityChatThread>(
      { queryKey: ["community-chat-thread", churchId] },
      (current) => {
        if (!current) return current;
        if (current.root.id === message.id) {
          return { ...current, root: { ...current.root, ...message } };
        }
        const replyIndex = current.replies.findIndex((item) => item.id === message.id);
        if (replyIndex === -1) return current;
        const replies = [...current.replies];
        replies[replyIndex] = message;
        return { ...current, replies };
      }
    );
  }

  function applyReactions(
    messageId: string,
    reactions: CommunityChatMessage["reactions"]
  ) {
    queryClient.setQueryData<ChatCache>(queryKey, (current) => {
      const existing = current?.messages ?? messages;
      return {
        messages: existing.map((item) =>
          item.id === messageId ? { ...item, reactions } : item
        ),
        hasMore: current?.hasMore ?? hasMore,
      };
    });
    queryClient.setQueriesData<CommunityChatThread>(
      { queryKey: ["community-chat-thread", churchId] },
      (current) => {
        if (!current) return current;
        if (current.root.id === messageId) {
          return { ...current, root: { ...current.root, reactions } };
        }
        return {
          ...current,
          replies: current.replies.map((item) =>
            item.id === messageId ? { ...item, reactions } : item
          ),
        };
      }
    );
  }

  function incrementReplyCount(parentId: string, reply: CommunityChatMessage) {
    queryClient.setQueryData<ChatCache>(queryKey, (current) => {
      const existing = current?.messages ?? messages;
      return {
        messages: existing.map((item) =>
          item.id === parentId
            ? { ...item, replyCount: item.replyCount + 1 }
            : item
        ),
        hasMore: current?.hasMore ?? hasMore,
      };
    });
    queryClient.setQueryData<CommunityChatThread>(
      ["community-chat-thread", churchId, parentId],
      (current) => {
        if (!current) return current;
        if (current.replies.some((item) => item.id === reply.id)) return current;
        return {
          root: { ...current.root, replyCount: current.root.replyCount + 1 },
          replies: [...current.replies, reply],
        };
      }
    );
  }

  const sendMutation = useMutation({
    mutationFn: async ({
      content,
      replyToId,
    }: {
      content: string;
      replyToId?: string;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Sign in to send a message.");
      return sendCommunityMessage(content, token, replyToId);
    },
    onSuccess: (message, variables) => {
      if (variables.replyToId) {
        incrementReplyCount(variables.replyToId, message);
      } else {
        patchMessage(message);
        stickToBottomRef.current = true;
      }
      setDraft("");
      setReplyingTo(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not send.");
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const token = await getToken();
      if (!token) throw new Error("Sign in to edit a message.");
      return editCommunityMessage(id, content, token);
    },
    onSuccess: (message) => {
      patchMessage(message);
      setEditingId(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not edit.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error("Sign in to delete a message.");
      return deleteCommunityMessage(id, token);
    },
    onSuccess: (message) => {
      patchMessage(message);
      setDeleteTarget(null);
      if (editingId === message.id) setEditingId(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not delete.");
    },
  });

  const reactMutation = useMutation({
    mutationFn: async ({
      id,
      type,
    }: {
      id: string;
      type: CommunityReactionType;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Sign in to react.");
      return toggleCommunityReaction(id, type, token);
    },
    onSuccess: (result) => {
      applyReactions(result.messageId, result.reactions);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not react.");
    },
  });

  const reportMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const token = await getToken();
      if (!token) throw new Error("Sign in to report a message.");
      return reportCommunityMessage(id, reason, token);
    },
    onSuccess: (result) => {
      setReportTarget(null);
      toast.success(
        result.duplicate ? "You already reported this message." : "Message reported."
      );
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not report.");
    },
  });

  useLayoutEffect(() => {
    const node = scrollerRef.current;
    if (!node || !stickToBottomRef.current) return;
    node.scrollTop = node.scrollHeight;
  }, [messages.length, sendMutation.isPending]);

  function onScroll() {
    const node = scrollerRef.current;
    if (!node) return;
    const remaining = node.scrollHeight - node.scrollTop - node.clientHeight;
    stickToBottomRef.current = remaining < 80;
  }

  async function loadOlder() {
    if (!hasMore || loadingOlder || messages.length === 0) return;
    const token = await getToken();
    if (!token) return;
    setLoadingOlder(true);
    const node = scrollerRef.current;
    const previousHeight = node?.scrollHeight ?? 0;
    try {
      const page = await fetchCommunityMessages(token, {
        before: messages[0].createdAt,
      });
      setHasMore(page.hasMore);
      queryClient.setQueryData<ChatCache>(queryKey, (current) => {
        const existing = current?.messages ?? messages;
        const ids = new Set(existing.map((item) => item.id));
        const older = page.messages.filter((item) => !ids.has(item.id));
        return {
          messages: [...older, ...existing],
          hasMore: page.hasMore,
        };
      });
      window.requestAnimationFrame(() => {
        if (!node) return;
        node.scrollTop = node.scrollHeight - previousHeight;
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not load earlier messages."
      );
    } finally {
      setLoadingOlder(false);
    }
  }

  useEffect(() => {
    if (!replyingTo) return;
    document.getElementById("community-message")?.focus();
  }, [replyingTo]);

  const canSubmit = Boolean(draft.trim()) && !sendMutation.isPending && canChat;

  function startReply(message: CommunityChatMessage) {
    setThreadRootId(null);
    setReplyingTo(message);
  }

  function openThread(message: CommunityChatMessage) {
    setReplyingTo(null);
    setThreadRootId(message.replyTo?.id ?? message.id);
  }

  function messageActions() {
    return {
      onReply: startReply,
      onOpenThread: openThread,
      onReact: (item: CommunityChatMessage, type: CommunityReactionType) =>
        reactMutation.mutate({ id: item.id, type }),
      onEdit: (item: CommunityChatMessage) => setEditingId(item.id),
      onSaveEdit: (item: CommunityChatMessage, content: string) =>
        editMutation.mutate({ id: item.id, content }),
      onCancelEdit: () => setEditingId(null),
      onDelete: setDeleteTarget,
      onReport: (item: CommunityChatMessage) => {
        setReportReason(COMMUNITY_REPORT_REASONS[0]);
        setReportTarget(item);
      },
    };
  }

  return (
    <div className="relative flex min-h-0 flex-1 bg-background">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 sm:px-5"
        >
          {!canChat ?
            <div className="flex h-full min-h-[12rem] flex-col items-center justify-center px-4 text-center">
              <p className="font-heading text-lg font-semibold text-[#0F172A]">
                Conversation unavailable
              </p>
              <p className="mt-1 max-w-sm text-sm text-[#64748B]">
                You must be an approved member of {churchName} to read or send
                Community Chat messages.
              </p>
            </div>
          : query.isLoading && messages.length === 0 ?
            <div className="mx-auto w-full max-w-[52.5rem] space-y-3 pt-2">
              <Skeleton className="h-10 w-[68%] rounded-2xl" />
              <Skeleton className="ml-auto h-10 w-[52%] rounded-2xl" />
              <Skeleton className="h-10 w-[60%] rounded-2xl" />
            </div>
          : messages.length === 0 ?
            <div className="flex h-full min-h-[12rem] flex-col items-center justify-center px-4 text-center">
              <p className="font-heading text-lg font-semibold text-[#0F172A]">
                No messages yet
              </p>
              <p className="mt-1 max-w-sm text-sm text-[#64748B]">
                Start the conversation with your church community.
              </p>
            </div>
          : <div className="mx-auto w-full max-w-[52.5rem]">
              {hasMore ?
                <div className="mb-4 flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9"
                    disabled={loadingOlder}
                    onClick={() => void loadOlder()}
                  >
                    {loadingOlder ?
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Loading…
                      </>
                    : "Load earlier messages"}
                  </Button>
                </div>
              : null}
              <ol className="flex flex-col">
                {messages.map((message, index) => (
                  <CommunityChatMessageRow
                    key={message.id}
                    message={message}
                    isMine={
                      Boolean(currentUserId) && message.userId === currentUserId
                    }
                    grouped={shouldGroupCommunityMessages(
                      message,
                      messages[index - 1]
                    )}
                    groupContinues={shouldGroupCommunityMessages(
                      messages[index + 1],
                      message
                    )}
                    timestamp={formatCommunityTime(message.createdAt)}
                    editing={editingId === message.id}
                    editPending={editMutation.isPending}
                    {...messageActions()}
                  />
                ))}
              </ol>
            </div>
          }
        </div>

        {canChat && !threadRootId ?
          <div className="shrink-0 border-t border-[#E6E8EC] bg-background px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3 sm:px-5">
            <div className="mx-auto w-full max-w-[52.5rem]">
              {replyingTo ?
                <div className="mb-2 flex items-start justify-between gap-3 rounded-xl border border-[#E6E8EC] bg-[#F6F7FB] px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-primary">
                      Replying to {replyingTo.authorName}
                    </p>
                    <p className="truncate text-xs text-[#64748B]">
                      {replyingTo.deletedAt
                        ? "This message was deleted"
                        : replyingTo.content}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    aria-label="Cancel reply"
                    onClick={() => setReplyingTo(null)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              : null}
              <CommunityChatComposer
                id="community-message"
                label={`Write a message to ${churchName}`}
                draft={draft}
                placeholder={replyingTo ? "Write a reply…" : "Write a message…"}
                disabled={sendMutation.isPending}
                canSubmit={canSubmit}
                pending={sendMutation.isPending}
                onDraftChange={setDraft}
                onSubmit={() => {
                  if (!canSubmit) return;
                  if (!replyingTo) stickToBottomRef.current = true;
                  sendMutation.mutate({
                    content: draft,
                    replyToId: replyingTo?.id,
                  });
                }}
              />
            </div>
          </div>
        : null}
      </div>

      {threadRootId ?
        <>
          <button
            type="button"
            className="absolute inset-0 z-10 hidden bg-[#0F172A]/[0.08] lg:block"
            aria-label="Close thread"
            onClick={() => setThreadRootId(null)}
          />
          <CommunityChatThreadPanel
          churchId={churchId}
          currentUserId={currentUserId}
          rootId={threadRootId}
          canChat={canChat}
          getToken={getToken}
          editingId={editingId}
          editPending={editMutation.isPending}
          onClose={() => setThreadRootId(null)}
          onSendReply={(content) =>
            sendMutation.mutate({ content, replyToId: threadRootId ?? undefined })
          }
          replyPending={sendMutation.isPending}
          {...messageActions()}
        />
        </>
      : null}

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this message?</AlertDialogTitle>
            <AlertDialogDescription>
              This message will be removed from the conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={Boolean(reportTarget)}
        onOpenChange={(open) => {
          if (!open) setReportTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report message</DialogTitle>
            <DialogDescription>
              Why are you reporting this message?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {COMMUNITY_REPORT_REASONS.map((reason) => (
              <label
                key={reason}
                className="flex items-center gap-2 rounded-lg border border-[#E6E8EC] px-3 py-2 text-sm"
              >
                <input
                  type="radio"
                  name="community-report-reason"
                  checked={reportReason === reason}
                  onChange={() => setReportReason(reason)}
                />
                {reason}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReportTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!reportTarget || reportMutation.isPending}
              onClick={() => {
                if (!reportTarget) return;
                reportMutation.mutate({
                  id: reportTarget.id,
                  reason: reportReason,
                });
              }}
            >
              {reportMutation.isPending ?
                <Loader2 className="size-4 animate-spin" />
              : "Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
