"use client";

import type {
  CommunityChatMessage,
  CommunityChatPage,
  CommunityChatReactionResult,
  CommunityChatReportResult,
  CommunityChatThread,
} from "@/types/community-chat";

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

export async function fetchCommunityMessages(
  token: string,
  options?: { before?: string; limit?: number }
): Promise<CommunityChatPage> {
  const params = new URLSearchParams();
  if (options?.before) params.set("before", options.before);
  if (options?.limit) params.set("limit", String(options.limit));
  const query = params.toString();
  const response = await fetch(
    query ? `/api/community/messages?${query}` : "/api/community/messages",
    { headers: authHeaders(token), cache: "no-store" }
  );
  return parseJson<CommunityChatPage>(response);
}

export async function fetchCommunityThread(
  messageId: string,
  token: string
): Promise<CommunityChatThread> {
  const response = await fetch(`/api/community/messages/${messageId}/replies`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  return parseJson<CommunityChatThread>(response);
}

export async function sendCommunityMessage(
  content: string,
  token: string,
  replyToMessageId?: string
): Promise<CommunityChatMessage> {
  const response = await fetch("/api/community/messages", {
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
  return parseJson<CommunityChatMessage>(response);
}

export async function editCommunityMessage(
  messageId: string,
  content: string,
  token: string
): Promise<CommunityChatMessage> {
  const response = await fetch(`/api/community/messages/${messageId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({ content }),
  });
  return parseJson<CommunityChatMessage>(response);
}

export async function deleteCommunityMessage(
  messageId: string,
  token: string
): Promise<CommunityChatMessage> {
  const response = await fetch(`/api/community/messages/${messageId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  return parseJson<CommunityChatMessage>(response);
}

export async function toggleCommunityReaction(
  messageId: string,
  reactionType: string,
  token: string
): Promise<CommunityChatReactionResult> {
  const response = await fetch(
    `/api/community/messages/${messageId}/reactions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({ reactionType }),
    }
  );
  return parseJson<CommunityChatReactionResult>(response);
}

export async function reportCommunityMessage(
  messageId: string,
  reason: string,
  token: string
): Promise<CommunityChatReportResult> {
  const response = await fetch(`/api/community/messages/${messageId}/reports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({ reason }),
  });
  return parseJson<CommunityChatReportResult>(response);
}
