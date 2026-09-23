import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { churchVideos } from "@/db/schema";
import { isPlatformSuperAdmin } from "@/lib/auth/platform-role";
import type { ContentQueryInput } from "@/lib/content/content-scope";
import { contentScopeWhere, resolveContentQuery } from "@/lib/content/content-scope";
import { parseChurchVideoUrl } from "@/lib/media-url-validation";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { userCanManageChurch } from "@/lib/postgres/session";
import { getChurchById } from "@/lib/postgres/tenants";
import type { ChurchVideo } from "@/types/church-video";
import type { ShortCategory } from "@/types/video-short";

type VideoRow = typeof churchVideos.$inferSelect;

function mapVideoRow(row: VideoRow, canManage = false): ChurchVideo {
  return {
    id: row.id,
    organizationId: row.organizationId ?? "",
    churchId: row.churchId ?? "",
    title: row.title,
    description: row.description,
    externalUrl: row.externalUrl,
    provider: row.provider,
    thumbnailUrl: row.thumbnailUrl,
    category: row.category as ShortCategory,
    tags: row.tags ?? [],
    published: row.published,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    canManage,
  };
}

async function requireManageChurch(
  clerkId: string,
  email: string | undefined,
  churchId: string
) {
  const allowed = await userCanManageChurch(clerkId, email, churchId);
  if (!allowed) {
    throw new Error("Forbidden");
  }
}

async function requireManageVideo(
  clerkId: string,
  email: string | undefined,
  row: VideoRow
) {
  if (row.contentScope === "platform_public") {
    const appUser = await getAppUserByClerkId(clerkId);
    if (!isPlatformSuperAdmin(appUser?.platformRole)) {
      throw new Error("Forbidden");
    }
    return;
  }
  if (!row.churchId) {
    throw new Error("Forbidden");
  }
  await requireManageChurch(clerkId, email, row.churchId);
}

function parseTags(tags: string[] | undefined): string[] {
  if (!tags) return [];
  return [
    ...new Set(
      tags
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 12)
    ),
  ];
}

export async function listPublishedChurchVideos(input: {
  query: ContentQueryInput;
  viewerClerkId?: string | null;
  viewerEmail?: string;
  includeUnpublished?: boolean;
  limit?: number;
}): Promise<ChurchVideo[]> {
  const resolved = resolveContentQuery(input.query);
  if (resolved.kind === "empty") return [];

  const limit = Math.min(input.limit ?? 24, 48);
  const includeUnpublished = Boolean(input.includeUnpublished);

  let canManage = false;
  if (includeUnpublished && input.viewerClerkId) {
    if (resolved.kind === "platform_public") {
      const appUser = await getAppUserByClerkId(input.viewerClerkId);
      canManage = isPlatformSuperAdmin(appUser?.platformRole);
    } else {
      canManage = await userCanManageChurch(
        input.viewerClerkId,
        input.viewerEmail,
        resolved.churchId
      );
    }
  }

  const rows = await db
    .select()
    .from(churchVideos)
    .where(
      and(
        contentScopeWhere(
          {
            contentScope: churchVideos.contentScope,
            organizationId: churchVideos.organizationId,
            churchId: churchVideos.churchId,
          },
          resolved
        ),
        canManage ? undefined : eq(churchVideos.published, true)
      )
    )
    .orderBy(desc(churchVideos.publishedAt), desc(churchVideos.createdAt))
    .limit(limit);

  return rows
    .filter((row) => canManage || row.published)
    .map((row) => mapVideoRow(row, canManage));
}

export async function getChurchVideoById(videoId: string) {
  const [row] = await db
    .select()
    .from(churchVideos)
    .where(eq(churchVideos.id, videoId))
    .limit(1);
  return row ?? null;
}

export async function createChurchVideo(input: {
  clerkId: string;
  email?: string;
  churchId?: string;
  contentScope?: "organization" | "platform_public";
  title: string;
  description?: string;
  externalUrl: string;
  thumbnailUrl?: string | null;
  category?: ShortCategory;
  tags?: string[];
  published?: boolean;
}): Promise<ChurchVideo> {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Title is required.");
  }

  const parsed = parseChurchVideoUrl(input.externalUrl);
  if (!parsed) {
    throw new Error(
      "Enter a YouTube, Vimeo, or Instagram video URL."
    );
  }

  const appUser = await getAppUserByClerkId(input.clerkId);
  if (!appUser) {
    throw new Error("Application user not found.");
  }

  const contentScope = input.contentScope ?? "organization";
  const published = Boolean(input.published);
  const thumbnailUrl =
    input.thumbnailUrl?.trim() || parsed.thumbnailUrl || null;

  if (contentScope === "platform_public") {
    if (!isPlatformSuperAdmin(appUser.platformRole)) {
      throw new Error("Forbidden");
    }

    const [inserted] = await db
      .insert(churchVideos)
      .values({
        contentScope: "platform_public",
        organizationId: null,
        churchId: null,
        title,
        description: input.description?.trim() ?? "",
        externalUrl: parsed.canonicalUrl,
        provider: parsed.provider,
        thumbnailUrl,
        category: input.category ?? "Other",
        tags: parseTags(input.tags),
        published,
        createdBy: appUser.id,
        publishedAt: published ? new Date() : null,
      })
      .returning();

    if (!inserted) throw new Error("Failed to create video.");
    return mapVideoRow(inserted, true);
  }

  const churchId = input.churchId?.trim() ?? "";
  if (!churchId) {
    throw new Error("No active church context");
  }

  await requireManageChurch(input.clerkId, input.email, churchId);

  const church = await getChurchById(churchId);
  if (!church?.organizationId) {
    throw new Error("Church not found.");
  }

  const { assertUsageAllowed } = await import(
    "@/lib/subscription/subscription-server"
  );
  await assertUsageAllowed(church.organizationId, "shorts");

  const [inserted] = await db
    .insert(churchVideos)
    .values({
      contentScope: "organization",
      organizationId: church.organizationId,
      churchId: church.id,
      title,
      description: input.description?.trim() ?? "",
      externalUrl: parsed.canonicalUrl,
      provider: parsed.provider,
      thumbnailUrl,
      category: input.category ?? "Other",
      tags: parseTags(input.tags),
      published,
      createdBy: appUser.id,
      publishedAt: published ? new Date() : null,
    })
    .returning();

  if (!inserted) throw new Error("Failed to create video.");
  return mapVideoRow(inserted, true);
}

export async function updateChurchVideo(input: {
  videoId: string;
  clerkId: string;
  email?: string;
  title?: string;
  description?: string;
  externalUrl?: string;
  thumbnailUrl?: string | null;
  category?: ShortCategory;
  tags?: string[];
  published?: boolean;
}): Promise<ChurchVideo> {
  const row = await getChurchVideoById(input.videoId);
  if (!row) throw new Error("Video not found");

  await requireManageVideo(input.clerkId, input.email, row);

  if (row.organizationId) {
    const { assertSubscriptionWritable } = await import(
      "@/lib/subscription/subscription-server"
    );
    await assertSubscriptionWritable(row.organizationId);
  }

  let externalUrl = row.externalUrl;
  let provider = row.provider;
  let thumbnailUrl = row.thumbnailUrl;

  if (typeof input.externalUrl === "string") {
    const parsed = parseChurchVideoUrl(input.externalUrl);
    if (!parsed) {
      throw new Error("Enter a YouTube, Vimeo, or Instagram video URL.");
    }
    externalUrl = parsed.canonicalUrl;
    provider = parsed.provider;
    if (input.thumbnailUrl === undefined && !row.thumbnailUrl) {
      thumbnailUrl = parsed.thumbnailUrl;
    }
  }

  if (input.thumbnailUrl !== undefined) {
    thumbnailUrl = input.thumbnailUrl?.trim() || null;
  }

  const nextPublished =
    input.published === undefined ? row.published : input.published;
  const publishedAt =
    nextPublished ?
      (row.publishedAt ?? new Date())
    : null;

  const [updated] = await db
    .update(churchVideos)
    .set({
      title: input.title?.trim() || row.title,
      description:
        input.description !== undefined ?
          input.description.trim()
        : row.description,
      externalUrl,
      provider,
      thumbnailUrl,
      category: input.category ?? row.category,
      tags: input.tags ? parseTags(input.tags) : row.tags,
      published: nextPublished,
      publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(churchVideos.id, row.id))
    .returning();

  if (!updated) throw new Error("Failed to update video.");
  return mapVideoRow(updated, true);
}

export async function deleteChurchVideo(input: {
  videoId: string;
  clerkId: string;
  email?: string;
}): Promise<void> {
  const row = await getChurchVideoById(input.videoId);
  if (!row) throw new Error("Video not found");
  await requireManageVideo(input.clerkId, input.email, row);
  await db.delete(churchVideos).where(eq(churchVideos.id, row.id));
}

export async function getChurchVideoForViewer(
  videoId: string,
  viewerClerkId?: string | null,
  viewerEmail?: string
): Promise<ChurchVideo | null> {
  const row = await getChurchVideoById(videoId);
  if (!row) return null;

  let canManage = false;
  if (viewerClerkId) {
    try {
      await requireManageVideo(viewerClerkId, viewerEmail, row);
      canManage = true;
    } catch {
      canManage = false;
    }
  }

  if (!row.published && !canManage) return null;
  return mapVideoRow(row, canManage);
}
