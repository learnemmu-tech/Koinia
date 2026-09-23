"use client";

import type {
  GroupChatMessage,
  GroupChatPage,
  GroupChatReactionResult,
  GroupChatReportResult,
  GroupChatThread,
} from "@/types/group-chat";

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(error?.error ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

function messagesBase(groupId: string) {
  return `/api/groups/${encodeURIComponent(groupId)}/messages`;
}

export async function fetchGroupMessages(
  groupId: string,
  token: string,
  options?: { before?: string; limit?: number }
): Promise<GroupChatPage> {
  const params = new URLSearchParams();
  if (options?.before) params.set("before", options.before);
  if (options?.limit) params.set("limit", String(options.limit));
  const query = params.toString();
  const response = await fetch(
    query ? `${messagesBase(groupId)}?${query}` : messagesBase(groupId),
    { headers: authHeaders(token), cache: "no-store" }
  );
  return parseJson<GroupChatPage>(response);
}

export async function fetchGroupThread(
  groupId: string,
  messageId: string,
  token: string
): Promise<GroupChatThread> {
  const response = await fetch(
    `${messagesBase(groupId)}/${encodeURIComponent(messageId)}/replies`,
    { headers: authHeaders(token), cache: "no-store" }
  );
  return parseJson<GroupChatThread>(response);
}

export async function sendGroupMessage(
  groupId: string,
  content: string,
  token: string,
  replyToMessageId?: string
): Promise<GroupChatMessage> {
  const response = await fetch(messagesBase(groupId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({
      content,
      ...(replyToMessageId ? { replyToMessageId } : {}),
    }),
  });
  return parseJson<GroupChatMessage>(response);
}

export async function editGroupMessage(
  groupId: string,
  messageId: string,
  content: string,
  token: string
): Promise<GroupChatMessage> {
  const response = await fetch(
    `${messagesBase(groupId)}/${encodeURIComponent(messageId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({ content }),
    }
  );
  return parseJson<GroupChatMessage>(response);
}

export async function deleteGroupMessage(
  groupId: string,
  messageId: string,
  token: string
): Promise<GroupChatMessage> {
  const response = await fetch(
    `${messagesBase(groupId)}/${encodeURIComponent(messageId)}`,
    { method: "DELETE", headers: authHeaders(token) }
  );
  return parseJson<GroupChatMessage>(response);
}

export async function toggleGroupReaction(
  groupId: string,
  messageId: string,
  reactionType: string,
  token: string
): Promise<GroupChatReactionResult> {
  const response = await fetch(
    `${messagesBase(groupId)}/${encodeURIComponent(messageId)}/reactions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({ reactionType }),
    }
  );
  return parseJson<GroupChatReactionResult>(response);
}

export async function reportGroupMessage(
  groupId: string,
  messageId: string,
  reason: string,
  token: string
): Promise<GroupChatReportResult> {
  const response = await fetch(
    `${messagesBase(groupId)}/${encodeURIComponent(messageId)}/reports`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({ reason }),
    }
  );
  return parseJson<GroupChatReportResult>(response);
}
