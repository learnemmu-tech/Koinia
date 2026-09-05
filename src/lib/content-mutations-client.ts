"use client";

import { fetchWithAuth } from "@/lib/api-client";
import type {
  CreateArticleInput,
  UpdateArticleInput,
} from "@/types/firebase-article";
import type { CreateEventInput, UpdateEventInput } from "@/types/firebase-event";
import type {
  CreateSermonInput,
  UpdateSermonInput,
} from "@/types/firebase-sermon";
import type { CreateSongInput, UpdateSongInput } from "@/types/firebase-song";

type CollectionName = "songs" | "sermons" | "articles" | "events";

async function mutateContent<T>(body: {
  collection: CollectionName;
  op: "create" | "update" | "delete";
  id?: string;
  churchId?: string;
  data?: Record<string, unknown>;
}): Promise<T> {
  const response = await fetchWithAuth("/api/content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(payload.error ?? "Failed to save content.");
  }

  return response.json() as Promise<T>;
}

export async function addSong(
  churchId: string,
  songData: CreateSongInput,
  _options?: { branchId?: string; organizationIdFallback?: string }
): Promise<string> {
  const result = await mutateContent<{ id: string }>({
    collection: "songs",
    op: "create",
    churchId,
    data: songData as unknown as Record<string, unknown>,
  });
  return result.id;
}

export async function updateSong(
  songId: string,
  updates: UpdateSongInput
): Promise<void> {
  await mutateContent({
    collection: "songs",
    op: "update",
    id: songId,
    data: updates as unknown as Record<string, unknown>,
  });
}

export async function deleteSong(songId: string): Promise<void> {
  await mutateContent({ collection: "songs", op: "delete", id: songId });
}

export async function createSermon(input: CreateSermonInput): Promise<string> {
  const result = await mutateContent<{ id: string }>({
    collection: "sermons",
    op: "create",
    churchId: input.churchId,
    data: input as unknown as Record<string, unknown>,
  });
  return result.id;
}

export async function updateSermon(
  sermonId: string,
  updates: UpdateSermonInput
): Promise<void> {
  await mutateContent({
    collection: "sermons",
    op: "update",
    id: sermonId,
    data: updates as unknown as Record<string, unknown>,
  });
}

export async function deleteSermon(sermonId: string): Promise<void> {
  await mutateContent({ collection: "sermons", op: "delete", id: sermonId });
}

export async function createArticle(input: CreateArticleInput): Promise<string> {
  const result = await mutateContent<{ id: string }>({
    collection: "articles",
    op: "create",
    churchId: input.churchId,
    data: input as unknown as Record<string, unknown>,
  });
  return result.id;
}

export async function updateArticle(
  articleId: string,
  updates: UpdateArticleInput
): Promise<void> {
  await mutateContent({
    collection: "articles",
    op: "update",
    id: articleId,
    data: updates as unknown as Record<string, unknown>,
  });
}

export async function deleteArticle(articleId: string): Promise<void> {
  await mutateContent({ collection: "articles", op: "delete", id: articleId });
}

export async function createEvent(input: CreateEventInput): Promise<string> {
  const result = await mutateContent<{ id: string }>({
    collection: "events",
    op: "create",
    churchId: input.churchId,
    data: input as unknown as Record<string, unknown>,
  });
  return result.id;
}

export async function updateEvent(
  eventId: string,
  input: UpdateEventInput
): Promise<void> {
  await mutateContent({
    collection: "events",
    op: "update",
    id: eventId,
    data: input as unknown as Record<string, unknown>,
  });
}

export async function deleteEvent(eventId: string): Promise<void> {
  await mutateContent({ collection: "events", op: "delete", id: eventId });
}
