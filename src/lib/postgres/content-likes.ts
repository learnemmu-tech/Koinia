import "server-only";

import { and, eq, inArray, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { articles, books, churchVideos, contentLikes, sermons, songs } from "@/db/schema";
import { LIKE_ITEM_TYPES, type LikeItemType } from "@/lib/like-types";
import { mayLikeContent } from "@/lib/security/like-access";
import {
  userCanAccessChurchContent,
  userCanManageChurch,
} from "@/lib/postgres/session";

export type { LikeItemType } from "@/lib/like-types";
export { LIKE_ITEM_TYPES } from "@/lib/like-types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type LikeTarget = {
  itemType: LikeItemType;
  itemId: string;
};

export function parseLikeTarget(
  itemType: string,
  itemId: string
): LikeTarget | null {
  if (!LIKE_ITEM_TYPES.includes(itemType as LikeItemType)) return null;
  const id = itemId.trim();
  if (!UUID_PATTERN.test(id)) return null;
  return { itemType: itemType as LikeItemType, itemId: id };
}

function targetKey(item: LikeTarget) {
  return `${item.itemType}:${item.itemId}`;
}

function targetWhere(items: LikeTarget[]) {
  return or(
    ...items.map((item) =>
      and(
        eq(contentLikes.itemType, item.itemType),
        eq(contentLikes.itemId, item.itemId)
      )
    )
  );
}

export async function summarizeLikes(
  items: LikeTarget[],
  appUserId: string | null
): Promise<Record<string, { count: number; liked: boolean }>> {
  const unique = new Map<string, LikeTarget>();
  for (const item of items.slice(0, 40)) {
    unique.set(targetKey(item), item);
  }
  const targets = [...unique.values()];
  const result: Record<string, { count: number; liked: boolean }> = {};
  for (const item of targets) {
    result[targetKey(item)] = { count: 0, liked: false };
  }
  if (targets.length === 0) return result;

  const where = targetWhere(targets);
  const counts = await db
    .select({
      itemType: contentLikes.itemType,
      itemId: contentLikes.itemId,
      count: sql<number>`count(*)::int`,
    })
    .from(contentLikes)
    .where(where)
    .groupBy(contentLikes.itemType, contentLikes.itemId);

  for (const row of counts) {
    const key = `${row.itemType}:${row.itemId}`;
    if (result[key]) result[key].count = Number(row.count) || 0;
  }

  if (appUserId) {
    const mine = await db
      .select({
        itemType: contentLikes.itemType,
        itemId: contentLikes.itemId,
      })
      .from(contentLikes)
      .where(and(eq(contentLikes.userId, appUserId), where));
    for (const row of mine) {
      const key = `${row.itemType}:${row.itemId}`;
      if (result[key]) result[key].liked = true;
    }
  }

  return result;
}

export async function toggleLike(
  appUserId: string,
  clerkId: string,
  item: LikeTarget
): Promise<{ liked: boolean; count: number }> {
  const visible = await filterVisibleLikeTargets(clerkId, [item]);
  const existing = await db
    .select({ id: contentLikes.id })
    .from(contentLikes)
    .where(
      and(
        eq(contentLikes.userId, appUserId),
        eq(contentLikes.itemType, item.itemType),
        eq(contentLikes.itemId, item.itemId)
      )
    )
    .limit(1);

  if (!visible.length && !existing[0]) {
    throw new Error("Content not found.");
  }

  if (existing[0]) {
    await db.delete(contentLikes).where(eq(contentLikes.id, existing[0].id));
  } else {
    await db
      .insert(contentLikes)
      .values({
        userId: appUserId,
        itemType: item.itemType,
        itemId: item.itemId,
      })
      .onConflictDoNothing();
  }

  const summary = await summarizeLikes([item], appUserId);
  return summary[targetKey(item)] ?? { liked: !existing[0], count: 0 };
}

type LikeRow = {
  id: string;
  churchId: string | null;
  contentScope: string;
  published: boolean;
  membersOnly: boolean;
};

async function loadLikeRows(items: LikeTarget[]): Promise<Map<string, LikeRow>> {
  const idsFor = (type: LikeItemType) =>
    items.filter((item) => item.itemType === type).map((item) => item.itemId);
  const songIds = idsFor("song");
  const sermonIds = idsFor("sermon");
  const articleIds = idsFor("article");
  const bookIds = idsFor("book");
  const videoIds = idsFor("video");

  const [songRows, sermonRows, articleRows, bookRows, videoRows] = await Promise.all([
    songIds.length
      ? db
          .select({
            id: songs.id,
            churchId: songs.churchId,
            contentScope: songs.contentScope,
            published: songs.published,
          })
          .from(songs)
          .where(inArray(songs.id, songIds))
      : [],
    sermonIds.length
      ? db
          .select({
            id: sermons.id,
            churchId: sermons.churchId,
            contentScope: sermons.contentScope,
            published: sermons.isPublished,
          })
          .from(sermons)
          .where(inArray(sermons.id, sermonIds))
      : [],
    articleIds.length
      ? db
          .select({
            id: articles.id,
            churchId: articles.churchId,
            contentScope: articles.contentScope,
            published: articles.isPublished,
          })
          .from(articles)
          .where(inArray(articles.id, articleIds))
      : [],
    bookIds.length
      ? db
          .select({
            id: books.id,
            churchId: books.churchId,
            status: books.status,
            visibility: books.visibility,
          })
          .from(books)
          .where(inArray(books.id, bookIds))
      : [],
    videoIds.length
      ? db
          .select({
            id: churchVideos.id,
            churchId: churchVideos.churchId,
            contentScope: churchVideos.contentScope,
            published: churchVideos.published,
          })
          .from(churchVideos)
          .where(inArray(churchVideos.id, videoIds))
      : [],
  ]);

  const map = new Map<string, LikeRow>();
  for (const row of songRows) {
    map.set(`song:${row.id}`, {
      id: row.id,
      churchId: row.churchId,
      contentScope: row.contentScope,
      published: row.published,
      membersOnly: false,
    });
  }
  for (const row of sermonRows) {
    map.set(`sermon:${row.id}`, {
      id: row.id,
      churchId: row.churchId,
      contentScope: row.contentScope,
      published: row.published,
      membersOnly: false,
    });
  }
  for (const row of articleRows) {
    map.set(`article:${row.id}`, {
      id: row.id,
      churchId: row.churchId,
      contentScope: row.contentScope,
      published: row.published,
      membersOnly: false,
    });
  }
  for (const row of bookRows) {
    map.set(`book:${row.id}`, {
      id: row.id,
      churchId: row.churchId,
      contentScope: "organization",
      published: row.status === "published",
      membersOnly: row.visibility === "members_only",
    });
  }
  for (const row of videoRows) {
    map.set(`video:${row.id}`, {
      id: row.id,
      churchId: row.churchId,
      contentScope: row.contentScope,
      published: row.published,
      membersOnly: false,
    });
  }
  return map;
}

export async function filterVisibleLikeTargets(
  clerkId: string | null,
  items: LikeTarget[]
): Promise<LikeTarget[]> {
  if (!clerkId || items.length === 0) return [];
  const rows = await loadLikeRows(items);
  const accessCache = new Map<
    string,
    { hasChurchAccess: boolean; canManageChurch: boolean }
  >();
  const visible: LikeTarget[] = [];
  for (const item of items) {
    const row = rows.get(targetKey(item));
    if (!row) continue;
    let access = { hasChurchAccess: false, canManageChurch: false };
    if (row.churchId && (!row.published || row.membersOnly)) {
      const cached = accessCache.get(row.churchId);
      if (cached) {
        access = cached;
      } else {
        const [hasChurchAccess, canManageChurch] = await Promise.all([
          userCanAccessChurchContent(clerkId, undefined, row.churchId),
          userCanManageChurch(clerkId, undefined, row.churchId),
        ]);
        access = { hasChurchAccess, canManageChurch };
        accessCache.set(row.churchId, access);
      }
    }
    if (
      mayLikeContent(
        {
          exists: true,
          published: row.published,
          membersOnly: row.membersOnly,
        },
        access
      )
    ) {
      visible.push(item);
    }
  }
  return visible;
}
