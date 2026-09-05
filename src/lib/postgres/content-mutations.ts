import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { articles, events, sermons, songs } from "@/db/schema";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import {
  mapArticle,
  mapEvent,
  mapSermon,
  mapSong,
} from "@/lib/postgres/mappers";
import { getClerkIdByUserId } from "@/lib/postgres/session";
import { getChurchRowById } from "@/lib/postgres/tenants";
import { isPostgresUuid } from "@/lib/postgres/uuid";
import { deleteStoredMediaUrls } from "@/lib/supabase-storage";
import type { CreateArticleInput, UpdateArticleInput } from "@/types/firebase-article";
import type { CreateEventInput, UpdateEventInput } from "@/types/firebase-event";
import type { CreateSermonInput, UpdateSermonInput } from "@/types/firebase-sermon";
import type { CreateSongInput, UpdateSongInput } from "@/types/firebase-song";

async function requireChurch(churchId: string) {
  const church = await getChurchRowById(churchId);
  if (!church) throw new Error("Church not found");
  return church;
}

export async function getSongById(songId: string) {
  if (!isPostgresUuid(songId)) return null;
  const [row] = await db.select().from(songs).where(eq(songs.id, songId)).limit(1);
  return row ? mapSong(row) : null;
}

export async function addSong(churchId: string, input: CreateSongInput): Promise<string> {
  const church = await requireChurch(churchId);
  const [row] = await db
    .insert(songs)
    .values({
      organizationId: church.organizationId,
      churchId: church.id,
      songTitle: input.songTitle.trim(),
      alternateTitle: input.alternateTitle?.trim() || null,
      artist: input.artist?.trim() || null,
      category: input.category ?? "Worship",
      originalLyrics: input.originalLyrics ?? "",
      translationLyrics: input.translationLyrics?.trim() || null,
      scriptureReference: input.scriptureReference?.trim() || null,
      tags: input.tags ?? [],
      featured: input.featured ?? false,
      published: input.published ?? true,
      imageUrl: input.imageUrl?.trim() || null,
      audioUrl: input.audioUrl?.trim() || null,
      youtubeUrl: input.youtubeUrl?.trim() || null,
    })
    .returning({ id: songs.id });
  if (!row) throw new Error("Failed to create song");
  return row.id;
}

export async function updateSong(songId: string, updates: UpdateSongInput): Promise<void> {
  const patch: Partial<typeof songs.$inferInsert> = { updatedAt: new Date() };
  if (updates.songTitle !== undefined) patch.songTitle = updates.songTitle.trim();
  if (updates.alternateTitle !== undefined) {
    patch.alternateTitle = updates.alternateTitle.trim() || null;
  }
  if (updates.artist !== undefined) patch.artist = updates.artist.trim() || null;
  if (updates.category !== undefined) patch.category = updates.category;
  if (updates.originalLyrics !== undefined) patch.originalLyrics = updates.originalLyrics;
  if (updates.translationLyrics !== undefined) {
    patch.translationLyrics = updates.translationLyrics.trim() || null;
  }
  if (updates.scriptureReference !== undefined) {
    patch.scriptureReference = updates.scriptureReference.trim() || null;
  }
  if (updates.tags !== undefined) patch.tags = updates.tags;
  if (updates.featured !== undefined) patch.featured = updates.featured;
  if (updates.published !== undefined) patch.published = updates.published;
  if (updates.imageUrl !== undefined) patch.imageUrl = updates.imageUrl.trim() || null;
  if (updates.audioUrl !== undefined) patch.audioUrl = updates.audioUrl.trim() || null;
  if (updates.youtubeUrl !== undefined) patch.youtubeUrl = updates.youtubeUrl.trim() || null;
  await db.update(songs).set(patch).where(eq(songs.id, songId));
}

export async function deleteSong(songId: string): Promise<void> {
  const existing = await getSongById(songId);
  await deleteStoredMediaUrls(existing?.imageUrl, existing?.audioUrl);
  await db.delete(songs).where(eq(songs.id, songId));
}

export async function getSermonById(sermonId: string) {
  const [row] = await db.select().from(sermons).where(eq(sermons.id, sermonId)).limit(1);
  if (!row) return null;
  const clerkId = row.createdBy ? await getClerkIdByUserId(row.createdBy) : "";
  return mapSermon(row, clerkId ?? "");
}

export async function createSermon(input: CreateSermonInput): Promise<string> {
  const church = await requireChurch(input.churchId);
  const creator = input.createdBy ? await getAppUserByClerkId(input.createdBy) : null;
  const [row] = await db
    .insert(sermons)
    .values({
      organizationId: church.organizationId,
      churchId: church.id,
      title: input.title.trim(),
      subtitle: input.subtitle?.trim() || null,
      scriptureReference: input.scriptureReference ?? "",
      speaker: input.speaker ?? "",
      shortDescription: input.shortDescription ?? "",
      content: input.content ?? "",
      tags: input.tags ?? [],
      youtubeUrl: input.youtubeUrl?.trim() || null,
      audioUrl: input.audioUrl?.trim() || null,
      coverImage: input.coverImage?.trim() || null,
      createdBy: creator?.id ?? null,
      isPublished: input.isPublished,
    })
    .returning({ id: sermons.id });
  if (!row) throw new Error("Failed to create sermon");
  return row.id;
}

export async function updateSermon(
  sermonId: string,
  updates: UpdateSermonInput
): Promise<void> {
  const patch: Partial<typeof sermons.$inferInsert> = { updatedAt: new Date() };
  if (updates.title !== undefined) patch.title = updates.title.trim();
  if (updates.subtitle !== undefined) patch.subtitle = updates.subtitle.trim() || null;
  if (updates.scriptureReference !== undefined) {
    patch.scriptureReference = updates.scriptureReference;
  }
  if (updates.speaker !== undefined) patch.speaker = updates.speaker;
  if (updates.shortDescription !== undefined) patch.shortDescription = updates.shortDescription;
  if (updates.content !== undefined) patch.content = updates.content;
  if (updates.tags !== undefined) patch.tags = updates.tags;
  if (updates.youtubeUrl !== undefined) patch.youtubeUrl = updates.youtubeUrl.trim() || null;
  if (updates.audioUrl !== undefined) patch.audioUrl = updates.audioUrl.trim() || null;
  if (updates.coverImage !== undefined) patch.coverImage = updates.coverImage.trim() || null;
  if (updates.isPublished !== undefined) patch.isPublished = updates.isPublished;
  await db.update(sermons).set(patch).where(eq(sermons.id, sermonId));
}

export async function deleteSermon(sermonId: string): Promise<void> {
  const existing = await getSermonById(sermonId);
  await deleteStoredMediaUrls(existing?.coverImage, existing?.audioUrl);
  await db.delete(sermons).where(eq(sermons.id, sermonId));
}

export async function getArticleById(articleId: string) {
  const [row] = await db.select().from(articles).where(eq(articles.id, articleId)).limit(1);
  if (!row) return null;
  const clerkId = row.createdBy ? await getClerkIdByUserId(row.createdBy) : "";
  return mapArticle(row, clerkId ?? "");
}

export async function createArticle(input: CreateArticleInput): Promise<string> {
  const church = await requireChurch(input.churchId);
  const creator = input.createdBy ? await getAppUserByClerkId(input.createdBy) : null;
  const [row] = await db
    .insert(articles)
    .values({
      organizationId: church.organizationId,
      churchId: church.id,
      title: input.title.trim(),
      category: input.category || "Christian Living",
      shortDescription: input.shortDescription ?? "",
      scriptureReference: input.scriptureReference?.trim() || null,
      content: input.content ?? "",
      coverImage: input.coverImage?.trim() || null,
      author: input.author ?? "",
      tags: input.tags ?? [],
      youtubeUrl: input.youtubeUrl?.trim() || null,
      featured: input.featured ?? false,
      createdBy: creator?.id ?? null,
      isPublished: input.isPublished,
    })
    .returning({ id: articles.id });
  if (!row) throw new Error("Failed to create article");
  return row.id;
}

export async function updateArticle(
  articleId: string,
  updates: UpdateArticleInput
): Promise<void> {
  const patch: Partial<typeof articles.$inferInsert> = { updatedAt: new Date() };
  if (updates.title !== undefined) patch.title = updates.title.trim();
  if (updates.category !== undefined) patch.category = updates.category;
  if (updates.shortDescription !== undefined) patch.shortDescription = updates.shortDescription;
  if (updates.scriptureReference !== undefined) {
    patch.scriptureReference = updates.scriptureReference.trim() || null;
  }
  if (updates.content !== undefined) patch.content = updates.content;
  if (updates.coverImage !== undefined) patch.coverImage = updates.coverImage.trim() || null;
  if (updates.author !== undefined) patch.author = updates.author;
  if (updates.tags !== undefined) patch.tags = updates.tags;
  if (updates.youtubeUrl !== undefined) patch.youtubeUrl = updates.youtubeUrl.trim() || null;
  if (updates.featured !== undefined) patch.featured = updates.featured;
  if (updates.isPublished !== undefined) patch.isPublished = updates.isPublished;
  await db.update(articles).set(patch).where(eq(articles.id, articleId));
}

export async function deleteArticle(articleId: string): Promise<void> {
  const existing = await getArticleById(articleId);
  await deleteStoredMediaUrls(existing?.coverImage);
  await db.delete(articles).where(eq(articles.id, articleId));
}

export async function getEventById(eventId: string) {
  const [row] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  return row ? mapEvent(row) : null;
}

export async function createEvent(input: CreateEventInput): Promise<string> {
  const church = await requireChurch(input.churchId);
  const [row] = await db
    .insert(events)
    .values({
      organizationId: church.organizationId,
      churchId: church.id,
      title: input.title.trim(),
      description: input.description ?? "",
      bannerImage: input.bannerImage?.trim() || null,
      eventType: input.eventType,
      speakerName: input.speakerName ?? "",
      eventDate: input.eventDate,
      eventTime: input.eventTime ?? "",
      location: input.location ?? "",
      status: input.status,
    })
    .returning({ id: events.id });
  if (!row) throw new Error("Failed to create event");
  return row.id;
}

export async function updateEvent(eventId: string, updates: UpdateEventInput): Promise<void> {
  const patch: Partial<typeof events.$inferInsert> = { updatedAt: new Date() };
  if (updates.title !== undefined) patch.title = updates.title.trim();
  if (updates.description !== undefined) patch.description = updates.description;
  if (updates.bannerImage !== undefined) patch.bannerImage = updates.bannerImage.trim() || null;
  if (updates.eventType !== undefined) patch.eventType = updates.eventType;
  if (updates.speakerName !== undefined) patch.speakerName = updates.speakerName;
  if (updates.eventDate !== undefined) patch.eventDate = updates.eventDate;
  if (updates.eventTime !== undefined) patch.eventTime = updates.eventTime;
  if (updates.location !== undefined) patch.location = updates.location;
  if (updates.status !== undefined) patch.status = updates.status;
  await db.update(events).set(patch).where(eq(events.id, eventId));
}

export async function deleteEvent(eventId: string): Promise<void> {
  const existing = await getEventById(eventId);
  await deleteStoredMediaUrls(existing?.bannerImage);
  await db.delete(events).where(eq(events.id, eventId));
}
