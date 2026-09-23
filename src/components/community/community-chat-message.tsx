"use client";

import { useEffect, useState } from "react";
import {
  Flag,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Smile,
  Trash2,
} from "lucide-react";

import type {
  CommunityChatMessage,
  CommunityReactionType,
} from "@/types/community-chat";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  COMMUNITY_MESSAGE_MAX_LENGTH,
  COMMUNITY_REACTION_TYPES,
  COMMUNITY_REACTION_EMOJI,
} from "@/types/community-chat";
import { cn } from "@/lib/utils";

type CommunityChatMessageRowProps = {
  message: CommunityChatMessage;
  isMine: boolean;
  grouped: boolean;
  groupContinues: boolean;
  timestamp: string;
  compact?: boolean;
  inThread?: boolean;
  isThreadAnchor?: boolean;
  editing: boolean;
  editPending?: boolean;
  onReply: (message: CommunityChatMessage) => void;
  onOpenThread: (message: CommunityChatMessage) => void;
  onReact: (message: CommunityChatMessage, type: CommunityReactionType) => void;
  onEdit: (message: CommunityChatMessage) => void;
  onSaveEdit: (message: CommunityChatMessage, content: string) => void;
  onCancelEdit: () => void;
  onDelete: (message: CommunityChatMessage) => void;
  onReport: (message: CommunityChatMessage) => void;
};

export function CommunityChatMessageRow({
  message,
  isMine,
  grouped,
  groupContinues,
  timestamp,
  compact = false,
  inThread = false,
  isThreadAnchor = false,
  editing,
  editPending = false,
  onReply,
  onOpenThread,
  onReact,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onReport,
}: CommunityChatMessageRowProps) {
  const deleted = Boolean(message.deletedAt);
  const [editDraft, setEditDraft] = useState(message.content);

  useEffect(() => {
    if (editing) setEditDraft(message.content);
  }, [editing, message.content]);

  return (
    <li
      className={cn(
        "flex w-full min-w-0",
        isThreadAnchor || !isMine ? "justify-start" : "justify-end",
        isThreadAnchor
          ? "border-b border-[#E6E8EC] pb-3"
          : grouped
            ? "pt-0.5"
            : compact
              ? "pt-3"
              : "pt-3.5"
      )}
    >
      <div
        className={cn(
          "flex min-w-0",
          compact || isThreadAnchor
            ? "max-w-full"
            : "max-w-[88%] sm:max-w-[78%] lg:max-w-[70%]",
          isThreadAnchor || !isMine ? "flex-row" : "flex-row-reverse",
          grouped ? "gap-2" : "gap-2.5"
        )}
      >
        {grouped ?
          <span className="size-8 shrink-0" aria-hidden />
        : <Avatar className={cn("size-8 shrink-0", grouped ? "" : "mt-5")}>
            <AvatarFallback className="bg-primary/10 text-[11px] font-medium text-primary">
              {message.authorInitials}
            </AvatarFallback>
          </Avatar>
        }
        <div
          className={cn(
            "flex min-w-0 flex-col",
            isThreadAnchor || !isMine ? "items-start" : "items-end"
          )}
        >
          {grouped ?
            null
          : <p
              className={cn(
                "mb-1 truncate px-1 text-[13px] font-semibold text-[#0F172A]",
                isMine && !isThreadAnchor && "text-right"
              )}
            >
              {message.authorName}
            </p>
          }
          <div className="group/message relative max-w-full">
            {deleted || editing ?
              null
            : <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "absolute top-0.5 size-6 text-[#64748B] hover:bg-transparent hover:text-[#0F172A]",
                      isMine ? "-left-7" : "right-1",
                      "opacity-100 sm:opacity-0 sm:group-hover/message:opacity-100 sm:group-focus-within/message:opacity-100"
                    )}
                    aria-label="Message actions"
                  >
                    <MoreHorizontal className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align={isMine ? "end" : "start"}
                  side="top"
                  collisionPadding={12}
                  className="w-44"
                >
                  {inThread ?
                    null
                  : <DropdownMenuItem onSelect={() => onReply(message)}>
                      <MessageCircle className="size-3.5" />
                      Reply
                    </DropdownMenuItem>
                  }
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Smile className="size-3.5" />
                      React
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="flex flex-row gap-0.5 p-1">
                      {COMMUNITY_REACTION_TYPES.map((type) => (
                        <DropdownMenuItem
                          key={type}
                          className="size-8 justify-center p-0 text-base"
                          aria-label={`React with ${COMMUNITY_REACTION_EMOJI[type]}`}
                          onSelect={() => onReact(message, type)}
                        >
                          {COMMUNITY_REACTION_EMOJI[type]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  {isMine ?
                    <>
                      <DropdownMenuItem onSelect={() => onEdit(message)}>
                        <Pencil className="size-3.5" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={() => onDelete(message)}
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  : <DropdownMenuItem onSelect={() => onReport(message)}>
                      <Flag className="size-3.5" />
                      Report
                    </DropdownMenuItem>
                  }
                </DropdownMenuContent>
              </DropdownMenu>
            }
            <div
              className={cn(
                "max-w-full rounded-[16px] border px-3 py-1.5 text-[15px] leading-snug text-[#0F172A]",
                isThreadAnchor
                  ? "rounded-xl border-[#E6E8EC] bg-[#F6F7FB]"
                  : isMine
                  ? "rounded-br-md border-primary/15 bg-primary/[0.06]"
                  : "rounded-bl-md border-[#E6E8EC] bg-white"
              )}
            >
              {editing ?
                <div className="min-w-[12rem]">
                  <textarea
                    value={editDraft}
                    maxLength={COMMUNITY_MESSAGE_MAX_LENGTH}
                    disabled={editPending}
                    className="max-h-32 min-h-16 w-full resize-none bg-transparent text-[15px] outline-none"
                    onChange={(event) => setEditDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") onCancelEdit();
                    }}
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7"
                      onClick={onCancelEdit}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-7"
                      disabled={!editDraft.trim() || editPending}
                      onClick={() => onSaveEdit(message, editDraft)}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              : deleted ?
                <p className="italic text-[#64748B]">This message was deleted</p>
              : <p className={cn("whitespace-pre-wrap break-words", !isMine && "pr-5")}>
                  {message.content}
                </p>
              }
            </div>
          </div>
          {!deleted && (message.reactions ?? []).length > 0 ?
            <div className="mt-1 flex flex-wrap gap-1">
              {(message.reactions ?? []).map((reaction) => (
                <button
                  key={reaction.type}
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border bg-white px-1.5 py-0.5 text-[11px]",
                    reaction.reactedByMe
                      ? "border-primary/30 bg-primary/[0.06] text-primary"
                      : "border-[#E6E8EC] text-[#64748B]"
                  )}
                  aria-pressed={reaction.reactedByMe}
                  aria-label={`${reaction.emoji} ${reaction.count}`}
                  onClick={() => onReact(message, reaction.type)}
                >
                  <span>{reaction.emoji}</span>
                  {reaction.count}
                </button>
              ))}
            </div>
          : null}
          {!compact && !deleted && message.replyCount > 0 ?
            <button
              type="button"
              className="mt-1 px-1 text-[12px] text-[#64748B] hover:text-primary hover:underline"
              onClick={() => onOpenThread(message)}
            >
              💬 {message.replyCount}{" "}
              {message.replyCount === 1 ? "reply" : "replies"}
            </button>
          : null}
          {groupContinues ?
            null
          : <p
              className={cn(
                "mt-1 px-1 text-[11px] text-[#64748B]",
                isThreadAnchor || !isMine ? "text-left" : "text-right"
              )}
            >
              {deleted ?
                timestamp
              : <>
                  {message.editedAt ? <span>edited · </span> : null}
                  <time dateTime={message.createdAt}>{timestamp}</time>
                </>
              }
            </p>
          }
        </div>
      </div>
    </li>
  );
}
