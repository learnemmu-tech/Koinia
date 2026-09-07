"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  articles,
  donationCampaigns,
  events,
  sermons,
  songs,
  videoShorts,
} from "@/db/schema";
import { SUPER_ADMIN_BASE } from "@/lib/auth/auth-paths";
import { requirePlatformSuperAdmin } from "@/lib/auth/require-platform-super-admin";
import {
  deleteArticle,
  deleteDonationCampaign,
  deleteEvent,
  deleteSermon,
  deleteSong,
  getArticleById,
  getDonationCampaignById,
  getEventById,
  getSermonById,
  getSongById,
  updateArticle,
  updateDonationCampaign,
  updateEvent,
  updateSermon,
  updateSong,
} from "@/lib/postgres/features";
import {
  deleteShort,
  getShortById,
  publishShort,
  updateShortMetadata,
} from "@/lib/postgres/shorts";
import { isPostgresUuid } from "@/lib/postgres/uuid";
import {
  buildShortCaption,
  parseShortCaption,
  resolveShortCategory,
} from "@/lib/short-caption";
import type { FirebaseArticle } from "@/types/firebase-article";
import type { FirebaseDonationCampaign } from "@/types/firebase-donation";
import type { FirebaseEvent } from "@/types/firebase-event";
import type { FirebaseSermon } from "@/types/firebase-sermon";
import type { FirebaseSong } from "@/types/firebase-song";
import type { ShortVisibility } from "@/types/video-short";

import type { PlatformContentType } from "./platform-content-queries";

export type PlatformContentActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type PlatformShortDetails = {
  id: string;
  title: string;
  description: string;
  topic: string;
  visibility: ShortVisibility;
};

export type PlatformContentRecord =
  | { type: "songs"; record: FirebaseSong }
  | { type: "sermons"; record: FirebaseSermon }
  | { type: "articles"; record: FirebaseArticle }
  | { type: "events"; record: FirebaseEvent }
  | { type: "donations"; record: FirebaseDonationCampaign }
  | { type: "shorts"; record: PlatformShortDetails };

const TYPE_TAGS: Record<PlatformContentType, string> = {
  songs: "worship-songs",
  sermons: "worship-sermons",
  articles: "worship-articles",
  shorts: "shorts-platform_public",
  events: "events",
  donations: "donations",
};

/**
 * Confirms the record exists and is platform-owned before any mutation.
 * The SuperAdmin console must never reach an organization-owned row, even
 * though a SuperAdmin is otherwise authorized.
 */
async function isPlatformOwnedRecord(
  type: PlatformContentType,
  id: string
): Promise<boolean> {
  const scope = await readContentScope(type, id);
  return scope === "platform_public";
}

async function readContentScope(
  type: PlatformContentType,
  id: string
): Promise<string | null> {
  if (type === "songs") {
    const [row] = await db
      .select({ scope: songs.contentScope })
      .from(songs)
      .where(eq(songs.id, id))
      .limit(1);
    return row?.scope ?? null;
  }
  if (type === "sermons") {
    const [row] = await db
      .select({ scope: sermons.contentScope })
      .from(sermons)
      .where(eq(sermons.id, id))
      .limit(1);
    return row?.scope ?? null;
  }
  if (type === "articles") {
    const [row] = await db
      .select({ scope: articles.contentScope })
      .from(articles)
      .where(eq(articles.id, id))
      .limit(1);
    return row?.scope ?? null;
  }
  if (type === "shorts") {
    const [row] = await db
      .select({ scope: videoShorts.contentScope })
      .from(videoShorts)
      .where(eq(videoShorts.id, id))
      .limit(1);
    return row?.scope ?? null;
  }
  if (type === "events") {
    const [row] = await db
      .select({ scope: events.contentScope })
      .from(events)
      .where(eq(events.id, id))
      .limit(1);
    return row?.scope ?? null;
  }

  const [row] = await db
    .select({ scope: donationCampaigns.contentScope })
    .from(donationCampaigns)
    .where(eq(donationCampaigns.id, id))
    .limit(1);
  return row?.scope ?? null;
}

/** Per-record cache tags used by the public detail pages. */
function recordTag(type: PlatformContentType, id: string): string | null {
  switch (type) {
    case "songs":
      return `worship-song-${id}`;
    case "sermons":
      return `worship-sermon-${id}`;
    case "articles":
      return `worship-article-${id}`;
    case "events":
      return `event-${id}`;
    case "donations":
      return `donation-campaign-${id}`;
    case "shorts":
      return null;
  }
}

function revalidatePlatformContent(type: PlatformContentType, id: string) {
  revalidateTag(TYPE_TAGS[type]);
  revalidateTag("content-platform_public");
  revalidateTag("tenant-platform_public");
  revalidateTag("shorts-platform_public");

  const tag = recordTag(type, id);
  if (tag) revalidateTag(tag);

  revalidatePath(`${SUPER_ADMIN_BASE}/content`);
}

/**
 * Loads the full record for an edit form, on demand. The list view only needs
 * normalized columns, so the heavier record is fetched when Edit is opened.
 */
export async function loadPlatformContentRecord(
  type: PlatformContentType,
  id: string
): Promise<PlatformContentRecord | null> {
  await requirePlatformSuperAdmin();

  if (!isPostgresUuid(id)) return null;
  if (!(await isPlatformOwnedRecord(type, id))) return null;

  switch (type) {
    case "songs": {
      const record = await getSongById(id);
      return record ? { type: "songs", record } : null;
    }
    case "sermons": {
      const record = await getSermonById(id);
      return record ? { type: "sermons", record } : null;
    }
    case "articles": {
      const record = await getArticleById(id);
      return record ? { type: "articles", record } : null;
    }
    case "events": {
      const record = await getEventById(id);
      return record ? { type: "events", record } : null;
    }
    case "donations": {
      const record = await getDonationCampaignById(id);
      return record ? { type: "donations", record } : null;
    }
    case "shorts": {
      const short = await getShortById(id);
      if (!short) return null;
      const parsed = parseShortCaption(short.caption, short.category);
      return {
        type: "shorts",
        record: {
          id: short.id,
          title: parsed.title,
          description: parsed.description,
          topic: parsed.topic,
          visibility: short.visibility,
        },
      };
    }
  }
}

/** Shorts store title/description/topic inside `caption`, so edits go through
 * the same caption builder the public composer uses. */
export async function updatePlatformShortDetails(input: {
  id: string;
  title: string;
  description: string;
  topic: string;
  visibility: ShortVisibility;
}): Promise<PlatformContentActionResult> {
  await requirePlatformSuperAdmin();

  if (!isPostgresUuid(input.id)) {
    return { ok: false, error: "Invalid content id." };
  }
  if (!(await isPlatformOwnedRecord("shorts", input.id))) {
    return { ok: false, error: "Not platform content." };
  }
  if (!input.title.trim()) {
    return { ok: false, error: "Title is required." };
  }

  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return { ok: false, error: "Not signed in." };

    await updateShortMetadata({
      shortId: input.id,
      clerkId: userId,
      email: sessionClaims?.email as string | undefined,
      caption: buildShortCaption(input.title, input.description, input.topic),
      category: resolveShortCategory(input.topic),
      visibility: input.visibility,
    });
  } catch (error) {
    console.error("[super-admin] platform short update failed:", error);
    return { ok: false, error: "Could not update this Short." };
  }

  revalidatePlatformContent("shorts", input.id);
  return { ok: true };
}

export async function setPlatformContentPublished(
  type: PlatformContentType,
  id: string,
  published: boolean
): Promise<PlatformContentActionResult> {
  await requirePlatformSuperAdmin();

  if (!isPostgresUuid(id)) {
    return { ok: false, error: "Invalid content id." };
  }
  if (!(await isPlatformOwnedRecord(type, id))) {
    return { ok: false, error: "Not platform content." };
  }

  try {
    switch (type) {
      case "songs":
        await updateSong(id, { published });
        break;
      case "sermons":
        await updateSermon(id, { isPublished: published });
        break;
      case "articles":
        await updateArticle(id, { isPublished: published });
        break;
      case "events":
        await updateEvent(id, { status: published ? "published" : "draft" });
        break;
      case "donations":
        await updateDonationCampaign(id, {
          status: published ? "active" : "inactive",
        });
        break;
      case "shorts": {
        const { userId, sessionClaims } = await auth();
        if (!userId) return { ok: false, error: "Not signed in." };
        const email = sessionClaims?.email as string | undefined;

        const short = await getShortById(id);
        if (!short) return { ok: false, error: "Short not found." };

        // The public feed requires published_at, which only publishShort sets.
        if (published && !short.publishedAt) {
          if (!short.videoUrl) {
            return {
              ok: false,
              error: "This Short has no video yet, so it cannot be published.",
            };
          }
          await publishShort({
            shortId: id,
            clerkId: userId,
            email,
            videoUrl: short.videoUrl,
            caption: short.caption,
            category: short.category,
            visibility: "public",
          });
          break;
        }

        await updateShortMetadata({
          shortId: id,
          clerkId: userId,
          email,
          visibility: published ? "public" : "church",
        });
        break;
      }
    }
  } catch (error) {
    console.error("[super-admin] platform publish failed:", error);
    return { ok: false, error: "Could not update this content." };
  }

  revalidatePlatformContent(type, id);
  return { ok: true };
}

export async function deletePlatformContent(
  type: PlatformContentType,
  id: string
): Promise<PlatformContentActionResult> {
  await requirePlatformSuperAdmin();

  if (!isPostgresUuid(id)) {
    return { ok: false, error: "Invalid content id." };
  }
  if (!(await isPlatformOwnedRecord(type, id))) {
    return { ok: false, error: "Not platform content." };
  }

  try {
    switch (type) {
      case "songs":
        await deleteSong(id);
        break;
      case "sermons":
        await deleteSermon(id);
        break;
      case "articles":
        await deleteArticle(id);
        break;
      case "events":
        await deleteEvent(id);
        break;
      case "donations":
        await deleteDonationCampaign(id);
        break;
      case "shorts": {
        const { userId, sessionClaims } = await auth();
        if (!userId) return { ok: false, error: "Not signed in." };
        await deleteShort({
          shortId: id,
          clerkId: userId,
          email: sessionClaims?.email as string | undefined,
        });
        break;
      }
    }
  } catch (error) {
    console.error("[super-admin] platform delete failed:", error);
    return { ok: false, error: "Could not delete this content." };
  }

  revalidatePlatformContent(type, id);
  return { ok: true };
}
