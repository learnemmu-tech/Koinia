import "server-only";

import { and, asc, desc, eq, ilike, inArray, isNotNull, or, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  churches,
  users,
  videoShortComments,
  videoShortLikes,
  videoShortReports,
  videoShorts,
} from "@/db/schema";
import { deleteStoredMediaUrls } from "@/lib/supabase-storage";
import type { TenantScope } from "@/lib/organization/tenant-scope";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import {
  getUsersByIds,
  userCanAccessChurchContent,
  userCanManageChurch,
} from "@/lib/postgres/session";
import { getChurchById } from "@/lib/postgres/tenants";
import type {
  ShortCategory,
  ShortVisibility,
  ShortsFeedFilter,
  VideoShort,
  VideoShortComment,
  VideoShortCreator,
} from "@/types/video-short";

type ShortRow = typeof videoShorts.$inferSelect;

function mapCreator(
  user: typeof users.$inferSelect,
  clerkPhotoUrl?: string | null
): VideoShortCreator {
  const firstName = user.firstName ?? "";
  const lastName = user.lastName ?? "";
  const displayName = `${firstName} ${lastName}`.trim() || user.email;
  return {
    id: user.id,
    firstName,
    lastName,
    displayName,
    photoUrl: clerkPhotoUrl ?? null,
  };
}

function mapShortRow(
  row: ShortRow,
  creator: VideoShortCreator,
  churchName: string,
  likedByMe = false,
  canManage = false
): VideoShort {
  return {
    id: row.id,
    organizationId: row.organizationId,
    churchId: row.churchId,
    userId: row.userId,
    videoUrl: row.videoUrl,
    thumbnailUrl: row.thumbnailUrl,
    caption: row.caption,
    category: row.category as ShortCategory,
    duration: row.duration,
    visibility: row.visibility as ShortVisibility,
    viewCount: row.viewCount,
    likeCount: row.likeCount,
    commentCount: row.commentCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    creator,
    churchName,
    likedByMe,
    canManage,
  };
}

async function loadCreatorsMap(userIds: string[]) {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return new Map<string, VideoShortCreator>();
  const rows = await getUsersByIds(unique);
  const map = new Map<string, VideoShortCreator>();
  for (const row of rows) {
    map.set(row.id, mapCreator(row));
  }
  return map;
}

export async function getShortById(shortId: string) {
  const [row] = await db
    .select()
    .from(videoShorts)
    .where(eq(videoShorts.id, shortId))
    .limit(1);
  return row ?? null;
}

export async function canViewShort(
  short: ShortRow,
  clerkId: string | null,
  email: string | undefined
): Promise<boolean> {
  if (!short.videoUrl || !short.publishedAt) return false;
  if (short.visibility === "public") return true;
  if (!clerkId) return false;
  return userCanAccessChurchContent(clerkId, email, short.churchId);
}

async function requireViewableShort(
  shortId: string,
  clerkId: string | null,
  email?: string
) {
  const short = await getShortById(shortId);
  if (!short) throw new Error("Short not found.");
  const canView = await canViewShort(short, clerkId, email);
  if (!canView) throw new Error("Short not found.");
  return short;
}

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

export async function listShortsForScope(input: {
  scope: TenantScope;
  filter: ShortsFeedFilter;
  query?: string | null;
  viewerClerkId?: string | null;
  viewerEmail?: string;
  limit?: number;
}): Promise<VideoShort[]> {
  const churchId = input.scope.churchId;
  if (!churchId) return [];

  const limit = Math.min(input.limit ?? 30, 50);
  const viewerClerkId = input.viewerClerkId ?? null;
  let canViewChurchOnly = false;
  if (viewerClerkId) {
    canViewChurchOnly = await userCanAccessChurchContent(
      viewerClerkId,
      input.viewerEmail,
      churchId
    );
  }

  const ownChurchVisibility = canViewChurchOnly
    ? or(
        eq(videoShorts.visibility, "public"),
        eq(videoShorts.visibility, "church")
      )
    : eq(videoShorts.visibility, "public");

  // "My Church" stays inside the active church. "Latest" widens to everything
  // published publicly across the organization, plus the viewer's own church.
  const scopeCondition =
    input.filter === "latest" && input.scope.organizationId ?
      and(
        eq(videoShorts.organizationId, input.scope.organizationId),
        or(
          eq(videoShorts.visibility, "public"),
          and(eq(videoShorts.churchId, churchId), ownChurchVisibility)
        )
      )
    : and(eq(videoShorts.churchId, churchId), ownChurchVisibility);

  const search = input.query?.trim() ?? "";
  const searchCondition =
    search ?
      (() => {
        const pattern = `%${escapeLikePattern(search)}%`;
        return or(
          ilike(videoShorts.caption, pattern),
          // `category` is a Postgres enum, so it needs an explicit text cast.
          sql`${videoShorts.category}::text ilike ${pattern}`,
          ilike(churches.name, pattern),
          ilike(users.email, pattern),
          sql`concat_ws(' ', ${users.firstName}, ${users.lastName}) ilike ${pattern}`
        );
      })()
    : undefined;

  const joined = await db
    .select({ short: videoShorts, churchName: churches.name })
    .from(videoShorts)
    .leftJoin(users, eq(users.id, videoShorts.userId))
    .leftJoin(churches, eq(churches.id, videoShorts.churchId))
    .where(
      and(
        isNotNull(videoShorts.videoUrl),
        isNotNull(videoShorts.publishedAt),
        scopeCondition,
        searchCondition
      )
    )
    .orderBy(desc(videoShorts.publishedAt))
    .limit(limit);

  const rows = joined.map((row) => row.short);
  const churchNames = new Map(
    joined.map((row) => [row.short.churchId, row.churchName ?? "Church"])
  );
  const creators = await loadCreatorsMap(rows.map((row) => row.userId));

  let likedIds = new Set<string>();
  let isAdmin = false;
  let viewerUserId: string | null = null;
  if (viewerClerkId) {
    const appUser = await getAppUserByClerkId(viewerClerkId);
    if (appUser) {
      viewerUserId = appUser.id;
      isAdmin = await userCanManageChurch(
        viewerClerkId,
        input.viewerEmail,
        churchId
      );
      if (rows.length > 0) {
        const likes = await db
          .select({ shortId: videoShortLikes.shortId })
          .from(videoShortLikes)
          .where(
            and(
              eq(videoShortLikes.userId, appUser.id),
              inArray(
                videoShortLikes.shortId,
                rows.map((row) => row.id)
              )
            )
          );
        likedIds = new Set(likes.map((like) => like.shortId));
      }
    }
  }

  return rows.map((row) =>
    mapShortRow(
      row,
      creators.get(row.userId) ?? {
        id: row.userId,
        firstName: "",
        lastName: "",
        displayName: "Member",
        photoUrl: null,
      },
      churchNames.get(row.churchId) ?? "Church",
      likedIds.has(row.id),
      (isAdmin && row.churchId === churchId) || row.userId === viewerUserId
    )
  );
}

export async function createShortDraft(input: {
  clerkId: string;
  email?: string;
  churchId: string;
  caption: string;
  category: ShortCategory;
  visibility: ShortVisibility;
}) {
  const allowed = await userCanAccessChurchContent(
    input.clerkId,
    input.email,
    input.churchId
  );
  if (!allowed) {
    throw new Error("You must be an active church member to post Shorts.");
  }

  const church = await getChurchById(input.churchId);
  if (!church?.organizationId) {
    throw new Error("Church not found.");
  }

  const appUser = await getAppUserByClerkId(input.clerkId);
  if (!appUser) {
    throw new Error("Application user not found.");
  }

  const [inserted] = await db
    .insert(videoShorts)
    .values({
      organizationId: church.organizationId,
      churchId: church.id,
      userId: appUser.id,
      caption: input.caption.trim(),
      category: input.category,
      visibility: input.visibility,
    })
    .returning();

  if (!inserted) {
    throw new Error("Failed to create Short.");
  }

  return inserted;
}

export async function publishShort(input: {
  shortId: string;
  clerkId: string;
  email?: string;
  videoUrl: string;
  thumbnailUrl?: string | null;
  duration?: number | null;
  caption?: string;
  category?: ShortCategory;
  visibility?: ShortVisibility;
}) {
  const short = await getShortById(input.shortId);
  if (!short) throw new Error("Short not found.");

  const isOwner = (await getAppUserByClerkId(input.clerkId))?.id === short.userId;
  const isAdmin = await userCanManageChurch(
    input.clerkId,
    input.email,
    short.churchId
  );
  if (!isOwner && !isAdmin) {
    throw new Error("Unauthorized");
  }

  const now = new Date();
  const isFirstPublish = !short.publishedAt;
  const [updated] = await db
    .update(videoShorts)
    .set({
      videoUrl: input.videoUrl,
      thumbnailUrl: input.thumbnailUrl ?? short.thumbnailUrl,
      duration: input.duration ?? short.duration,
      caption: input.caption?.trim() ?? short.caption,
      category: input.category ?? short.category,
      visibility: input.visibility ?? short.visibility,
      publishedAt: short.publishedAt ?? now,
      updatedAt: now,
    })
    .where(eq(videoShorts.id, short.id))
    .returning();

  return { ...updated!, isFirstPublish };
}

export async function updateShortMetadata(input: {
  shortId: string;
  clerkId: string;
  email?: string;
  caption?: string;
  category?: ShortCategory;
  visibility?: ShortVisibility;
}) {
  const short = await getShortById(input.shortId);
  if (!short) throw new Error("Short not found.");

  const appUser = await getAppUserByClerkId(input.clerkId);
  const isOwner = appUser?.id === short.userId;
  const isAdmin = await userCanManageChurch(
    input.clerkId,
    input.email,
    short.churchId
  );
  if (!isOwner && !isAdmin) throw new Error("Unauthorized");

  const [updated] = await db
    .update(videoShorts)
    .set({
      caption: input.caption?.trim() ?? short.caption,
      category: input.category ?? short.category,
      visibility: input.visibility ?? short.visibility,
      updatedAt: new Date(),
    })
    .where(eq(videoShorts.id, short.id))
    .returning();

  return updated!;
}

export async function updateShortThumbnailUrl(input: {
  shortId: string;
  clerkId: string;
  email?: string;
  thumbnailUrl: string | null;
}) {
  const short = await getShortById(input.shortId);
  if (!short) throw new Error("Short not found.");

  const appUser = await getAppUserByClerkId(input.clerkId);
  const isOwner = appUser?.id === short.userId;
  const isAdmin = await userCanManageChurch(
    input.clerkId,
    input.email,
    short.churchId
  );
  if (!isOwner && !isAdmin) throw new Error("Unauthorized");

  const previousUrl = short.thumbnailUrl;
  const nextUrl = input.thumbnailUrl?.trim() || null;

  if (previousUrl && previousUrl !== nextUrl && !nextUrl) {
    await deleteStoredMediaUrls(previousUrl);
  }

  const [updated] = await db
    .update(videoShorts)
    .set({
      thumbnailUrl: nextUrl,
      updatedAt: new Date(),
    })
    .where(eq(videoShorts.id, short.id))
    .returning();

  return updated!;
}

export async function setShortThumbnailUrl(
  shortId: string,
  thumbnailUrl: string | null
) {
  await db
    .update(videoShorts)
    .set({
      thumbnailUrl,
      updatedAt: new Date(),
    })
    .where(eq(videoShorts.id, shortId));
}

export async function deleteShort(input: {
  shortId: string;
  clerkId: string;
  email?: string;
}) {
  const short = await getShortById(input.shortId);
  if (!short) throw new Error("Short not found.");

  const appUser = await getAppUserByClerkId(input.clerkId);
  const isOwner = appUser?.id === short.userId;
  const isAdmin = await userCanManageChurch(
    input.clerkId,
    input.email,
    short.churchId
  );
  if (!isOwner && !isAdmin) throw new Error("Unauthorized");

  await deleteStoredMediaUrls(short.videoUrl, short.thumbnailUrl);
  await db.delete(videoShorts).where(eq(videoShorts.id, short.id));
}

export async function incrementShortViewCount(shortId: string) {
  await db
    .update(videoShorts)
    .set({ viewCount: sql`${videoShorts.viewCount} + 1` })
    .where(eq(videoShorts.id, shortId));
}

export async function toggleShortLike(input: {
  shortId: string;
  clerkId: string;
  email?: string;
}) {
  const short = await requireViewableShort(input.shortId, input.clerkId, input.email);

  const appUser = await getAppUserByClerkId(input.clerkId);
  if (!appUser) throw new Error("Unauthorized");

  const [existing] = await db
    .select()
    .from(videoShortLikes)
    .where(
      and(
        eq(videoShortLikes.shortId, short.id),
        eq(videoShortLikes.userId, appUser.id)
      )
    )
    .limit(1);

  if (existing) {
    await db.delete(videoShortLikes).where(eq(videoShortLikes.id, existing.id));
    await db
      .update(videoShorts)
      .set({
        likeCount: sql`GREATEST(${videoShorts.likeCount} - 1, 0)`,
      })
      .where(eq(videoShorts.id, short.id));

    const [updated] = await db
      .select({ likeCount: videoShorts.likeCount })
      .from(videoShorts)
      .where(eq(videoShorts.id, short.id))
      .limit(1);

    return { liked: false, likeCount: updated?.likeCount ?? Math.max(0, short.likeCount - 1) };
  }

  await db.insert(videoShortLikes).values({
    shortId: short.id,
    userId: appUser.id,
  });
  await db
    .update(videoShorts)
    .set({ likeCount: sql`${videoShorts.likeCount} + 1` })
    .where(eq(videoShorts.id, short.id));

  const [updated] = await db
    .select({ likeCount: videoShorts.likeCount })
    .from(videoShorts)
    .where(eq(videoShorts.id, short.id))
    .limit(1);

  return { liked: true, likeCount: updated?.likeCount ?? short.likeCount + 1 };
}

/**
 * Loads every comment for a Short in one query and builds the reply tree in
 * memory. Top-level comments stay newest-first; replies read oldest-first so a
 * thread reads like a conversation.
 */
export async function listShortComments(shortId: string): Promise<VideoShortComment[]> {
  const rows = await db
    .select()
    .from(videoShortComments)
    .where(eq(videoShortComments.shortId, shortId))
    .orderBy(asc(videoShortComments.createdAt))
    .limit(300);

  const creators = await loadCreatorsMap(rows.map((row) => row.userId));

  const nodes = new Map<string, VideoShortComment>();
  for (const row of rows) {
    nodes.set(row.id, {
      id: row.id,
      shortId: row.shortId,
      userId: row.userId,
      parentId: row.parentId ?? null,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
      creator:
        creators.get(row.userId) ?? {
          id: row.userId,
          firstName: "",
          lastName: "",
          displayName: "Member",
          photoUrl: null,
        },
      replies: [],
    });
  }

  const roots: VideoShortComment[] = [];
  for (const row of rows) {
    const node = nodes.get(row.id)!;
    const parent = row.parentId ? nodes.get(row.parentId) : undefined;
    if (parent && parent.id !== node.id) {
      parent.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  roots.reverse();
  return roots;
}

export async function getShortCommentsForViewer(
  shortId: string,
  viewerClerkId?: string | null,
  viewerEmail?: string
): Promise<VideoShortComment[]> {
  await requireViewableShort(shortId, viewerClerkId ?? null, viewerEmail);
  return listShortComments(shortId);
}

export async function addShortComment(input: {
  shortId: string;
  clerkId: string;
  email?: string;
  body: string;
  parentId?: string | null;
}) {
  const short = await requireViewableShort(input.shortId, input.clerkId, input.email);

  const appUser = await getAppUserByClerkId(input.clerkId);
  if (!appUser) throw new Error("Unauthorized");

  const body = input.body.trim();
  if (!body) throw new Error("Comment cannot be empty.");

  let parentId: string | null = null;
  const requestedParentId = input.parentId?.trim();
  if (requestedParentId) {
    const [parent] = await db
      .select({
        id: videoShortComments.id,
        shortId: videoShortComments.shortId,
      })
      .from(videoShortComments)
      .where(eq(videoShortComments.id, requestedParentId))
      .limit(1);

    if (!parent || parent.shortId !== short.id) {
      throw new Error("Parent comment not found.");
    }
    parentId = parent.id;
  }

  const [inserted] = await db
    .insert(videoShortComments)
    .values({
      shortId: short.id,
      userId: appUser.id,
      parentId,
      body,
    })
    .returning();

  await db
    .update(videoShorts)
    .set({ commentCount: sql`${videoShorts.commentCount} + 1` })
    .where(eq(videoShorts.id, short.id));

  return inserted!;
}

export async function deleteShortComment(input: {
  commentId: string;
  clerkId: string;
  email?: string;
}) {
  const [comment] = await db
    .select()
    .from(videoShortComments)
    .where(eq(videoShortComments.id, input.commentId))
    .limit(1);
  if (!comment) throw new Error("Comment not found.");

  const short = await getShortById(comment.shortId);
  if (!short) throw new Error("Short not found.");

  const appUser = await getAppUserByClerkId(input.clerkId);
  const isOwner = appUser?.id === comment.userId;
  const isAdmin = await userCanManageChurch(
    input.clerkId,
    input.email,
    short.churchId
  );
  if (!isOwner && !isAdmin) throw new Error("Unauthorized");

  // Replies cascade in the database, so the counter must drop by the whole thread.
  const threadSize = await db.execute<{ total: number }>(sql`
    with recursive thread as (
      select id from video_short_comments where id = ${comment.id}
      union all
      select child.id
      from video_short_comments child
      join thread on child.parent_id = thread.id
    )
    select count(*)::int as total from thread
  `);
  const removed = Number(threadSize.rows?.[0]?.total ?? 1) || 1;

  await db
    .delete(videoShortComments)
    .where(eq(videoShortComments.id, comment.id));
  await db
    .update(videoShorts)
    .set({
      commentCount: sql`GREATEST(${videoShorts.commentCount} - ${removed}, 0)`,
    })
    .where(eq(videoShorts.id, short.id));
}

export async function reportShort(input: {
  shortId: string;
  clerkId: string;
  email?: string;
  reason?: string;
}) {
  const short = await requireViewableShort(input.shortId, input.clerkId, input.email);

  const appUser = await getAppUserByClerkId(input.clerkId);
  if (!appUser) throw new Error("Unauthorized");

  try {
    await db.insert(videoShortReports).values({
      shortId: short.id,
      userId: appUser.id,
      reason: input.reason?.trim() ?? "",
    });
  } catch {
    // Already reported by this user.
  }

  return { reported: true };
}

export async function getShortForViewer(
  shortId: string,
  viewerClerkId?: string | null,
  viewerEmail?: string
): Promise<VideoShort | null> {
  const row = await getShortById(shortId);
  if (!row) return null;

  const canView = await canViewShort(row, viewerClerkId ?? null, viewerEmail);
  if (!canView) return null;

  const church = await getChurchById(row.churchId);
  const creators = await loadCreatorsMap([row.userId]);
  let likedByMe = false;
  let canManage = false;
  if (viewerClerkId) {
    const appUser = await getAppUserByClerkId(viewerClerkId);
    if (appUser) {
      const [like] = await db
        .select()
        .from(videoShortLikes)
        .where(
          and(
            eq(videoShortLikes.shortId, row.id),
            eq(videoShortLikes.userId, appUser.id)
          )
        )
        .limit(1);
      likedByMe = Boolean(like);
      canManage =
        row.userId === appUser.id ||
        (await userCanManageChurch(viewerClerkId, viewerEmail, row.churchId));
    }
  }

  return mapShortRow(
    row,
    creators.get(row.userId) ?? {
      id: row.userId,
      firstName: "",
      lastName: "",
      displayName: "Member",
      photoUrl: null,
    },
    church?.name ?? "Church",
    likedByMe,
    canManage
  );
}
