import {
  buildCountsFromRecords,
  rankContentByCounts,
  type AnalyticsContentItem,
  type RankedContentInsight,
  type RecentUserRow,
} from "@/lib/admin-analytics-utils";
import {
  listAnalyticsArticles,
  listAnalyticsSermons,
  listAnalyticsSongs,
  listAnalyticsUsers,
  listEngagementRecords,
} from "@/lib/postgres/analytics";

type AdminInsightsPayload = {
  topFavoritedSong: RankedContentInsight | null;
  topViewedSermon: RankedContentInsight | null;
  topReadArticle: RankedContentInsight | null;
  recentUsers: RecentUserRow[];
  userCount: number;
};

async function loadChurchContentItems(
  churchScope: string | null,
  organizationScope?: string | null
): Promise<{
  songs: AnalyticsContentItem[];
  sermons: AnalyticsContentItem[];
  articles: AnalyticsContentItem[];
}> {
  const scope = {
    churchId: churchScope,
    organizationId: organizationScope,
  };

  const [songs, sermons, articles] = await Promise.all([
    listAnalyticsSongs(scope),
    listAnalyticsSermons(scope),
    listAnalyticsArticles(scope),
  ]);

  return {
    songs: songs.map((song) => ({
      id: song.id,
      title: song.songTitle || song.title,
      churchId: song.churchId,
    })),
    sermons: sermons.map((sermon) => ({
      id: sermon.id,
      title: sermon.title,
      churchId: sermon.churchId,
    })),
    articles: articles.map((article) => ({
      id: article.id,
      title: article.title,
      churchId: article.churchId,
    })),
  };
}

export async function loadAdminAnalyticsInsights(
  churchScope: string | null,
  organizationScope?: string | null
): Promise<AdminInsightsPayload> {
  const scope = {
    churchId: churchScope,
    organizationId: organizationScope,
  };

  const [{ songs, sermons, articles }, engagement, users] = await Promise.all([
    loadChurchContentItems(churchScope, organizationScope),
    listEngagementRecords(),
    listAnalyticsUsers(scope),
  ]);

  const allowedSongIds = new Set(songs.map((item) => item.id));
  const allowedSermonIds = new Set(sermons.map((item) => item.id));
  const allowedArticleIds = new Set(articles.map((item) => item.id));

  const favoriteRecords = engagement.favorites.filter((record) => {
    if (record.itemType === "song") return allowedSongIds.has(record.itemId);
    if (record.itemType === "sermon") return allowedSermonIds.has(record.itemId);
    if (record.itemType === "article") return allowedArticleIds.has(record.itemId);
    return false;
  });

  const viewedRecords = engagement.recentlyViewed.filter((record) => {
    if (record.itemType === "sermon") return allowedSermonIds.has(record.itemId);
    if (record.itemType === "article") return allowedArticleIds.has(record.itemId);
    return false;
  });

  const songFavoriteCounts = buildCountsFromRecords(favoriteRecords, "song");
  const sermonViewCounts = buildCountsFromRecords(viewedRecords, "sermon");
  const sermonFavoriteCounts = buildCountsFromRecords(favoriteRecords, "sermon");
  const articleViewCounts = buildCountsFromRecords(viewedRecords, "article");
  const articleFavoriteCounts = buildCountsFromRecords(favoriteRecords, "article");

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
    recentUsers: users.recentUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.getTime(),
    })),
    userCount: users.userCount,
  };
}
