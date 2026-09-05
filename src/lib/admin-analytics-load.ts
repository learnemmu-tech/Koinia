"use server";

import {
  listAnalyticsArticles,
  listAnalyticsDonations,
  listAnalyticsEvents,
  listAnalyticsPrayerRequests,
  listAnalyticsSermons,
  listAnalyticsSongs,
  listAnalyticsUsers,
} from "@/lib/postgres/analytics";
import type { FirebaseArticle } from "@/types/firebase-article";
import type { FirebaseDonation } from "@/types/firebase-donation";
import type { FirebaseEvent } from "@/types/firebase-event";
import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";
import type { FirebaseSermon } from "@/types/firebase-sermon";
import type { FirebaseSong } from "@/types/firebase-song";

export type AdminAnalyticsCollections = {
  songs: FirebaseSong[];
  sermons: FirebaseSermon[];
  articles: FirebaseArticle[];
  events: FirebaseEvent[];
  prayerRequests: FirebasePrayerRequest[];
  donations: FirebaseDonation[];
  userCount: number;
};

export async function loadAdminAnalyticsCollections(
  churchScope: string | null,
  organizationScope?: string | null
): Promise<AdminAnalyticsCollections> {
  const scope = {
    churchId: churchScope,
    organizationId: organizationScope,
  };

  const [songs, sermons, articles, events, prayerRequests, donations, users] =
    await Promise.all([
      listAnalyticsSongs(scope),
      listAnalyticsSermons(scope),
      listAnalyticsArticles(scope),
      listAnalyticsEvents(scope),
      listAnalyticsPrayerRequests(scope),
      listAnalyticsDonations(scope),
      listAnalyticsUsers(scope),
    ]);

  return {
    songs,
    sermons,
    articles,
    events,
    prayerRequests,
    donations,
    userCount: users.userCount,
  };
}
