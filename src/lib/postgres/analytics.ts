import "server-only";

import type { AnyColumn } from "drizzle-orm";
import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  articles,
  churchMemberships,
  donations,
  events,
  favorites,
  organizationMemberships,
  prayerRequests,
  recentlyViewed,
  sermons,
  songs,
  users,
} from "@/db/schema";
import { mapArticle, mapDonation, mapEvent, mapPrayerRequest, mapSermon, mapSong } from "@/lib/postgres/mappers";
import { getClerkIdsByUserIds } from "@/lib/postgres/session";
import type { FirebaseArticle } from "@/types/firebase-article";
import type { FirebaseDonation } from "@/types/firebase-donation";
import type { FirebaseEvent } from "@/types/firebase-event";
import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";
import type { FirebaseSermon } from "@/types/firebase-sermon";
import type { FirebaseSong } from "@/types/firebase-song";

type AnalyticsScope = {
  churchId?: string | null;
  organizationId?: string | null;
};

function scopedWhere(
  churchIdColumn: AnyColumn,
  organizationIdColumn: AnyColumn,
  scope: AnalyticsScope
) {
  const churchId = scope.churchId?.trim();
  const organizationId = scope.organizationId?.trim();
  if (churchId) return eq(churchIdColumn, churchId);
  if (organizationId) return eq(organizationIdColumn, organizationId);
  return undefined;
}

export async function listAnalyticsSongs(
  scope: AnalyticsScope
): Promise<FirebaseSong[]> {
  const where = scopedWhere(songs.churchId, songs.organizationId, scope);
  const rows = where
    ? await db.select().from(songs).where(where).orderBy(desc(songs.createdAt))
    : await db.select().from(songs).orderBy(desc(songs.createdAt));
  return rows.map(mapSong);
}

export async function listAnalyticsSermons(
  scope: AnalyticsScope
): Promise<FirebaseSermon[]> {
  const where = scopedWhere(sermons.churchId, sermons.organizationId, scope);
  const rows = where
    ? await db.select().from(sermons).where(where).orderBy(desc(sermons.createdAt))
    : await db.select().from(sermons).orderBy(desc(sermons.createdAt));
  const clerkIds = await getClerkIdsByUserIds(
    rows.map((row) => row.createdBy).filter((id): id is string => Boolean(id))
  );
  return rows.map((row) =>
    mapSermon(row, row.createdBy ? clerkIds.get(row.createdBy) ?? "" : "")
  );
}

export async function listAnalyticsArticles(
  scope: AnalyticsScope
): Promise<FirebaseArticle[]> {
  const where = scopedWhere(articles.churchId, articles.organizationId, scope);
  const rows = where
    ? await db.select().from(articles).where(where).orderBy(desc(articles.createdAt))
    : await db.select().from(articles).orderBy(desc(articles.createdAt));
  const clerkIds = await getClerkIdsByUserIds(
    rows.map((row) => row.createdBy).filter((id): id is string => Boolean(id))
  );
  return rows.map((row) =>
    mapArticle(row, row.createdBy ? clerkIds.get(row.createdBy) ?? "" : "")
  );
}

export async function listAnalyticsEvents(
  scope: AnalyticsScope
): Promise<FirebaseEvent[]> {
  const where = scopedWhere(events.churchId, events.organizationId, scope);
  const rows = where
    ? await db.select().from(events).where(where).orderBy(desc(events.createdAt))
    : await db.select().from(events).orderBy(desc(events.createdAt));
  return rows.map(mapEvent);
}

export async function listAnalyticsPrayerRequests(
  scope: AnalyticsScope
): Promise<FirebasePrayerRequest[]> {
  const where = scopedWhere(prayerRequests.churchId, prayerRequests.organizationId, scope);
  const rows = where
    ? await db
        .select()
        .from(prayerRequests)
        .where(where)
        .orderBy(desc(prayerRequests.createdAt))
    : await db.select().from(prayerRequests).orderBy(desc(prayerRequests.createdAt));
  const clerkIds = await getClerkIdsByUserIds(
    rows.map((row) => row.userId).filter((id): id is string => Boolean(id))
  );
  return rows.map((row) =>
    mapPrayerRequest(row, row.userId ? clerkIds.get(row.userId) : null)
  );
}

export async function listAnalyticsDonations(
  scope: AnalyticsScope
): Promise<FirebaseDonation[]> {
  const where = scopedWhere(donations.churchId, donations.organizationId, scope);
  const rows = where
    ? await db.select().from(donations).where(where).orderBy(desc(donations.createdAt))
    : await db.select().from(donations).orderBy(desc(donations.createdAt));
  return rows.map(mapDonation);
}

export async function listEngagementRecords() {
  const [favoriteRows, viewedRows] = await Promise.all([
    db
      .select({
        itemId: favorites.itemId,
        itemType: favorites.itemType,
      })
      .from(favorites),
    db
      .select({
        itemId: recentlyViewed.itemId,
        itemType: recentlyViewed.itemType,
      })
      .from(recentlyViewed),
  ]);

  return {
    favorites: favoriteRows.map((row) => ({
      itemId: row.itemId,
      itemType: String(row.itemType),
    })),
    recentlyViewed: viewedRows.map((row) => ({
      itemId: row.itemId,
      itemType: String(row.itemType),
    })),
  };
}

export type AnalyticsUserRow = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};

async function mapUserRows(
  userIds: string[]
): Promise<AnalyticsUserRow[]> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return [];
  const rows = await db
    .select({
      id: users.id,
      clerkId: users.clerkId,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(inArray(users.id, unique));

  return rows
    .map((row) => ({
      id: row.clerkId ?? row.id,
      name: `${row.firstName} ${row.lastName}`.trim() || "Member",
      email: row.email,
      createdAt: row.createdAt,
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function listAnalyticsUsers(scope: AnalyticsScope): Promise<{
  recentUsers: AnalyticsUserRow[];
  userCount: number;
}> {
  const churchId = scope.churchId?.trim();
  const organizationId = scope.organizationId?.trim();

  if (organizationId) {
    const [orgRows, churchRows] = await Promise.all([
      db
        .select({ userId: organizationMemberships.userId })
        .from(organizationMemberships)
        .where(
          and(
            eq(organizationMemberships.organizationId, organizationId),
            eq(organizationMemberships.status, "active")
          )
        ),
      db
        .select({ userId: churchMemberships.userId })
        .from(churchMemberships)
        .where(
          and(
            eq(churchMemberships.organizationId, organizationId),
            eq(churchMemberships.status, "active")
          )
        ),
    ]);
    const mapped = await mapUserRows([
      ...orgRows.map((row) => row.userId),
      ...churchRows.map((row) => row.userId),
    ]);
    return { recentUsers: mapped.slice(0, 8), userCount: mapped.length };
  }

  if (churchId) {
    const churchRows = await db
      .select({ userId: churchMemberships.userId })
      .from(churchMemberships)
      .where(
        and(
          eq(churchMemberships.churchId, churchId),
          eq(churchMemberships.status, "active")
        )
      );
    const mapped = await mapUserRows(churchRows.map((row) => row.userId));
    return { recentUsers: mapped.slice(0, 8), userCount: mapped.length };
  }

  const rows = await db
    .select({
      id: users.id,
      clerkId: users.clerkId,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  const mapped = rows.map((row) => ({
    id: row.clerkId ?? row.id,
    name: `${row.firstName} ${row.lastName}`.trim() || "Member",
    email: row.email,
    createdAt: row.createdAt,
  }));

  return { recentUsers: mapped.slice(0, 8), userCount: mapped.length };
}
