import type { Firestore } from "firebase-admin/firestore";

import {
  buildCountsFromRecords,
  normalizeUserCreatedAt,
  rankContentByCounts,
  type AnalyticsContentItem,
  type RankedContentInsight,
  type RecentUserRow,
} from "@/lib/admin-analytics-utils";
import { BRANCH_MEMBERSHIPS_COLLECTION } from "@/lib/organization/branch-membership-firestore";
import { MEMBERSHIPS_COLLECTION } from "@/lib/organization/membership-firestore";
import { toMillis } from "@/lib/firebase-utils";
import { FAVORITES_COLLECTION } from "@/lib/favorite-firestore";
import { RECENTLY_VIEWED_COLLECTION } from "@/lib/recently-viewed-firestore";

type AdminInsightsPayload = {
  topFavoritedSong: RankedContentInsight | null;
  topViewedSermon: RankedContentInsight | null;
  topReadArticle: RankedContentInsight | null;
  recentUsers: RecentUserRow[];
  userCount: number;
};

function mapSongTitle(data: Record<string, unknown>): string {
  return String(data.songTitle ?? data.title ?? "Untitled song").trim();
}

function mapSermonTitle(data: Record<string, unknown>): string {
  return String(data.title ?? "Untitled sermon").trim();
}

function mapArticleTitle(data: Record<string, unknown>): string {
  return String(data.title ?? "Untitled article").trim();
}

async function loadChurchContentItems(
  adminDb: Firestore,
  churchScope: string | null
): Promise<{
  songs: AnalyticsContentItem[];
  sermons: AnalyticsContentItem[];
  articles: AnalyticsContentItem[];
}> {
  const scopedChurchId =
    churchScope?.trim() || null;
  const songs: AnalyticsContentItem[] = [];
  const sermons: AnalyticsContentItem[] = [];
  const articles: AnalyticsContentItem[] = [];

  const songsQuery = scopedChurchId
    ? adminDb.collection("songs").where("churchId", "==", scopedChurchId)
    : adminDb.collection("songs");

  const songsSnap = await songsQuery.get();
  for (const docSnap of songsSnap.docs) {
    const data = docSnap.data();
    songs.push({
      id: docSnap.id,
      title: mapSongTitle(data),
      churchId: String(data.churchId ?? ""),
    });
  }

  for (const collectionName of ["sermons", "ceremonies"] as const) {
    const sermonsQuery = scopedChurchId
      ? adminDb.collection(collectionName).where("churchId", "==", scopedChurchId)
      : adminDb.collection(collectionName);

    const sermonsSnap = await sermonsQuery.get();
    for (const docSnap of sermonsSnap.docs) {
      const data = docSnap.data();
      sermons.push({
        id: docSnap.id,
        title: mapSermonTitle(data),
        churchId: String(data.churchId ?? ""),
      });
    }
  }

  const articlesQuery = scopedChurchId
    ? adminDb.collection("articles").where("churchId", "==", scopedChurchId)
    : adminDb.collection("articles");

  const articlesSnap = await articlesQuery.get();
  for (const docSnap of articlesSnap.docs) {
    const data = docSnap.data();
    articles.push({
      id: docSnap.id,
      title: mapArticleTitle(data),
      churchId: String(data.churchId ?? ""),
    });
  }

  return { songs, sermons, articles };
}

function mapUserRow(
  id: string,
  data: Record<string, unknown>
): RecentUserRow {
  const firstName = String(data.firstName ?? "").trim();
  const lastName = String(data.lastName ?? "").trim();
  const name = [firstName, lastName].filter(Boolean).join(" ") || "Member";

  return {
    id,
    name,
    email: String(data.email ?? "").trim(),
    createdAt: normalizeUserCreatedAt(data.createdAt),
  };
}

async function loadOrganizationUsers(
  adminDb: Firestore,
  organizationId: string
): Promise<{ recentUsers: RecentUserRow[]; userCount: number }> {
  const [membershipSnap, branchMembershipSnap] = await Promise.all([
    adminDb
      .collection(MEMBERSHIPS_COLLECTION)
      .where("organizationId", "==", organizationId)
      .where("status", "==", "active")
      .get(),
    adminDb
      .collection(BRANCH_MEMBERSHIPS_COLLECTION)
      .where("organizationId", "==", organizationId)
      .where("status", "==", "active")
      .get(),
  ]);

  const userIds = new Set<string>();
  for (const docSnap of membershipSnap.docs) {
    const userId = String(docSnap.data().userId ?? "").trim();
    if (userId) userIds.add(userId);
  }
  for (const docSnap of branchMembershipSnap.docs) {
    const userId = String(docSnap.data().userId ?? "").trim();
    if (userId) userIds.add(userId);
  }

  const userRows = await Promise.all(
    [...userIds].map(async (userId) => {
      const userSnap = await adminDb.collection("users").doc(userId).get();
      if (!userSnap.exists) return null;
      const data = userSnap.data() as Record<string, unknown>;
      return {
        row: mapUserRow(userSnap.id, data),
        createdAtMs: toMillis(data.createdAt),
      };
    })
  );

  const deduped = userRows
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => b.createdAtMs - a.createdAtMs);

  return {
    recentUsers: deduped.slice(0, 8).map((entry) => entry.row),
    userCount: deduped.length,
  };
}

async function loadScopedUsers(
  adminDb: Firestore,
  churchScope: string | null,
  organizationScope?: string | null
): Promise<{ recentUsers: RecentUserRow[]; userCount: number }> {
  if (organizationScope?.trim()) {
    return loadOrganizationUsers(adminDb, organizationScope.trim());
  }

  const scopedChurchId = churchScope?.trim() || null;

  const usersQuery = scopedChurchId
    ? adminDb
        .collection("users")
        .where("churchId", "==", scopedChurchId)
        .orderBy("createdAt", "desc")
        .limit(8)
    : adminDb.collection("users").orderBy("createdAt", "desc").limit(8);

  const usersSnap = await usersQuery.get();
  const seen = new Set<string>();
  const recentUsers: RecentUserRow[] = [];

  for (const docSnap of usersSnap.docs) {
    if (seen.has(docSnap.id)) continue;
    seen.add(docSnap.id);
    recentUsers.push(mapUserRow(docSnap.id, docSnap.data() as Record<string, unknown>));
  }

  const countQuery = scopedChurchId
    ? adminDb.collection("users").where("churchId", "==", scopedChurchId)
    : adminDb.collection("users");

  const countSnap = await countQuery.count().get();

  return {
    recentUsers,
    userCount: countSnap.data().count,
  };
}

export async function loadAdminAnalyticsInsights(
  adminDb: Firestore,
  churchScope: string | null,
  organizationScope?: string | null
): Promise<AdminInsightsPayload> {
  const [{ songs, sermons, articles }, favoritesSnap, recentlyViewedSnap, users] =
    await Promise.all([
      loadChurchContentItems(adminDb, churchScope),
      adminDb.collection(FAVORITES_COLLECTION).get(),
      adminDb.collection(RECENTLY_VIEWED_COLLECTION).get(),
      loadScopedUsers(adminDb, churchScope, organizationScope),
    ]);

  const allowedSongIds = new Set(songs.map((item) => item.id));
  const allowedSermonIds = new Set(sermons.map((item) => item.id));
  const allowedArticleIds = new Set(articles.map((item) => item.id));

  const favoriteRecords = favoritesSnap.docs
    .map((docSnap) => docSnap.data())
    .filter((record) => {
      const itemType = String(record.itemType ?? "");
      const itemId = String(record.itemId ?? "");
      if (itemType === "song") return allowedSongIds.has(itemId);
      if (itemType === "sermon") return allowedSermonIds.has(itemId);
      if (itemType === "article") return allowedArticleIds.has(itemId);
      return false;
    })
    .map((record) => ({
      itemId: String(record.itemId ?? ""),
      itemType: String(record.itemType ?? ""),
    }));

  const viewedRecords = recentlyViewedSnap.docs
    .map((docSnap) => docSnap.data())
    .filter((record) => {
      const itemType = String(record.itemType ?? "");
      const itemId = String(record.itemId ?? "");
      if (itemType === "sermon") return allowedSermonIds.has(itemId);
      if (itemType === "article") return allowedArticleIds.has(itemId);
      return false;
    })
    .map((record) => ({
      itemId: String(record.itemId ?? ""),
      itemType: String(record.itemType ?? ""),
    }));

  const songFavoriteCounts = buildCountsFromRecords(favoriteRecords, "song");
  const sermonViewCounts = buildCountsFromRecords(viewedRecords, "sermon");
  const sermonFavoriteCounts = buildCountsFromRecords(favoriteRecords, "sermon");
  const articleViewCounts = buildCountsFromRecords(viewedRecords, "article");
  const articleFavoriteCounts = buildCountsFromRecords(
    favoriteRecords,
    "article"
  );

  const topViewedSermon =
    rankContentByCounts(sermonViewCounts, sermons) ??
    rankContentByCounts(sermonFavoriteCounts, sermons);

  const topReadArticle =
    rankContentByCounts(articleViewCounts, articles) ??
    rankContentByCounts(articleFavoriteCounts, articles);

  return {
    topFavoritedSong: rankContentByCounts(songFavoriteCounts, songs),
    topViewedSermon,
    topReadArticle,
    recentUsers: users.recentUsers,
    userCount: users.userCount,
  };
}
