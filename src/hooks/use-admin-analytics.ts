"use client";



import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {

  collection,

  getCountFromServer,

  getDocs,

  limit,

  orderBy,

  query,

  where,

  type QueryConstraint,

} from "firebase/firestore";



import type { FirebaseArticle } from "@/types/firebase-article";

import type { FirebaseDonation } from "@/types/firebase-donation";

import type { FirebaseEvent } from "@/types/firebase-event";

import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";

import type { FirebaseSermon } from "@/types/firebase-sermon";

import type { FirebaseSong } from "@/types/firebase-song";



import {

  aggregateContentGrowth,

  aggregateMonthlyDonations,

  buildCountsFromRecords,

  normalizeUserCreatedAt,

  rankContentByCounts,

  type AnalyticsContentItem,

  type ContentGrowthPoint,

  type MonthlyDonationPoint,

  type RankedContentInsight,

  type RecentUserRow,

} from "@/lib/admin-analytics-utils";

import { normalizeArticleFromFirestore } from "@/lib/article-firestore";

import {

  DONATIONS_COLLECTION,

  normalizeDonationFromFirestore,

} from "@/lib/donation-firestore";

import {

  EVENTS_COLLECTION,

  normalizeEventFromFirestore,

} from "@/lib/event-firestore";

import { FAVORITES_COLLECTION } from "@/lib/favorite-firestore";

import { loadAdminAnalyticsCollections } from "@/lib/admin-analytics-load";
import { db } from "@/lib/firebase";

import { firebaseAuth } from "@/lib/firebase-auth-service";

import { normalizePrayerRequestFromFirestore } from "@/lib/prayer-request-firestore";

import { RECENTLY_VIEWED_COLLECTION } from "@/lib/recently-viewed-firestore";

import {

  LEGACY_SERMONS_COLLECTION,

  SERMONS_COLLECTION,

  mergeSermonsById,

  normalizeSermonFromFirestore,

} from "@/lib/sermon-firestore";

import { normalizeSongFromFirestore } from "@/lib/song-firestore";

import { MULTI_CHURCH_ENABLED } from "@/lib/feature-flags";

import { useAdminChurchId, useIsPlatformSuperAdmin } from "@/hooks/use-admin-church-id";
import { useOrganizationOptional } from "@/context/organization-context";
import { isMultiChurchOrgWorkspace } from "@/lib/organization/workspace-type";



type AdminAnalyticsInsightsResponse = {

  topFavoritedSong: RankedContentInsight | null;

  topViewedSermon: RankedContentInsight | null;

  topReadArticle: RankedContentInsight | null;

  recentUsers: RecentUserRow[];

  userCount: number;

};



export type AdminAnalyticsState = {

  loading: boolean;

  insightsLoading: boolean;

  adminSdkUnavailable: boolean;

  counts: {

    songs: number;

    sermons: number;

    articles: number;

    prayerRequests: number;

    events: number;

    donations: number;

    users: number;

  };

  topFavoritedSong: RankedContentInsight | null;

  topViewedSermon: RankedContentInsight | null;

  topReadArticle: RankedContentInsight | null;

  recentUsers: RecentUserRow[];

  recentDonations: FirebaseDonation[];

  recentPrayerRequests: FirebasePrayerRequest[];

  recentEvents: FirebaseEvent[];

  monthlyDonations: MonthlyDonationPoint[];

  contentGrowth: ContentGrowthPoint[];

  scopeLabel: string;

  usingInsightsApi: boolean;

  refresh: () => void;
};



function buildScopedQuery(

  collectionName: string,

  churchScope: string | null,

  orderField: string,

  direction: "asc" | "desc" = "desc"

) {

  const constraints: QueryConstraint[] = [];



  if (churchScope?.trim()) {
    constraints.push(where("churchId", "==", churchScope.trim()));
  }



  constraints.push(orderBy(orderField, direction));

  return query(collection(db, collectionName), ...constraints);

}



function mapUserDocToRow(

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



export function useAdminAnalytics(): AdminAnalyticsState {

  const adminChurchId = useAdminChurchId();

  const isSuperAdmin = useIsPlatformSuperAdmin();
  const organization = useOrganizationOptional()?.organization;
  const isMultiOrg = isMultiChurchOrgWorkspace(organization);
  const organizationScope =
    isMultiOrg && organization?.id && !adminChurchId ? organization.id : null;

  const churchScope = isSuperAdmin ? null : adminChurchId;



  const [songs, setSongs] = useState<FirebaseSong[]>([]);

  const [sermons, setSermons] = useState<FirebaseSermon[]>([]);

  const [articles, setArticles] = useState<FirebaseArticle[]>([]);

  const [events, setEvents] = useState<FirebaseEvent[]>([]);

  const [prayerRequests, setPrayerRequests] = useState<FirebasePrayerRequest[]>(

    []

  );

  const [donations, setDonations] = useState<FirebaseDonation[]>([]);

  const [recentUsers, setRecentUsers] = useState<RecentUserRow[]>([]);

  const [userCount, setUserCount] = useState(0);

  const [topFavoritedSong, setTopFavoritedSong] =

    useState<RankedContentInsight | null>(null);

  const [topViewedSermon, setTopViewedSermon] =

    useState<RankedContentInsight | null>(null);

  const [topReadArticle, setTopReadArticle] =

    useState<RankedContentInsight | null>(null);



  const [loading, setLoading] = useState(true);

  const [insightsLoading, setInsightsLoading] = useState(true);

  const [usingInsightsApi, setUsingInsightsApi] = useState(false);

  const [adminSdkUnavailable, setAdminSdkUnavailable] = useState(false);

  const [refreshToken, setRefreshToken] = useState(0);

  const refresh = useCallback(() => {
    setInsightsLoading(true);
    setRefreshToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!isSuperAdmin && !churchScope) {
      setSongs([]);
      setSermons([]);
      setArticles([]);
      setEvents([]);
      setPrayerRequests([]);
      setDonations([]);
      setUserCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    void loadAdminAnalyticsCollections(churchScope)
      .then((data) => {
        if (cancelled) return;
        setSongs(data.songs);
        setSermons(data.sermons);
        setArticles(data.articles);
        setEvents(data.events);
        setPrayerRequests(data.prayerRequests);
        setDonations(data.donations);
        setUserCount(data.userCount);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [churchScope, isSuperAdmin, refreshToken]);



  const songItems = useMemo<AnalyticsContentItem[]>(

    () =>

      songs.map((song) => ({

        id: song.id,

        title: song.songTitle || song.title,

        churchId: song.churchId,

      })),

    [songs]

  );



  const sermonItems = useMemo<AnalyticsContentItem[]>(

    () =>

      sermons.map((sermon) => ({

        id: sermon.id,

        title: sermon.title,

        churchId: sermon.churchId,

      })),

    [sermons]

  );



  const articleItems = useMemo<AnalyticsContentItem[]>(

    () =>

      articles.map((article) => ({

        id: article.id,

        title: article.title,

        churchId: article.churchId,

      })),

    [articles]

  );



  useEffect(() => {

    if (!isSuperAdmin && !churchScope && !organizationScope) {

      setInsightsLoading(false);

      return;

    }



    let cancelled = false;

    let apiActive = true;

    const clientUnsubscribes: Array<() => void> = [];



    function applyInsightsPayload(payload: AdminAnalyticsInsightsResponse) {

      if (cancelled) return;

      setTopFavoritedSong(payload.topFavoritedSong);

      setTopViewedSermon(payload.topViewedSermon);

      setTopReadArticle(payload.topReadArticle);

      setRecentUsers(payload.recentUsers);

      setUserCount(payload.userCount);

      setInsightsLoading(false);

    }



    function refreshUserCount() {

      const countConstraints: QueryConstraint[] = [];

      if (churchScope?.trim()) {

        countConstraints.push(where("churchId", "==", churchScope));

      }



      const countQuery = query(collection(db, "users"), ...countConstraints);

      void getCountFromServer(countQuery)

        .then((snapshot) => {

          if (!cancelled) {

            setUserCount(snapshot.data().count);

          }

        })

        .catch(() => {

          // Count may fail if rules deny access; leave prior value.

        });

    }



    function startClientFallback(includeEngagement: boolean) {

      if (cancelled) return;



      apiActive = false;

      setUsingInsightsApi(false);



      const recentUsersConstraints: QueryConstraint[] = [];

      if (churchScope?.trim()) {

        recentUsersConstraints.push(where("churchId", "==", churchScope));

      }

      recentUsersConstraints.push(orderBy("createdAt", "desc"), limit(8));



      void getDocs(query(collection(db, "users"), ...recentUsersConstraints))
        .then((snapshot) => {
          if (cancelled) return;
          const seen = new Set<string>();
          const rows: RecentUserRow[] = [];
          for (const docSnap of snapshot.docs) {
            if (seen.has(docSnap.id)) continue;
            seen.add(docSnap.id);
            rows.push(
              mapUserDocToRow(
                docSnap.id,
                docSnap.data() as Record<string, unknown>
              )
            );
          }
          setRecentUsers(rows);
          setInsightsLoading(false);
        })
        .catch(() => {
          if (!cancelled) setInsightsLoading(false);
        });

      refreshUserCount();



      if (!includeEngagement) {

        return;

      }



      const allowedSongIds = new Set(songItems.map((item) => item.id));

      const allowedSermonIds = new Set(sermonItems.map((item) => item.id));

      const allowedArticleIds = new Set(articleItems.map((item) => item.id));



      const favoriteRecords: Array<{ itemId: string; itemType: string }> = [];

      const viewedRecords: Array<{ itemId: string; itemType: string }> = [];



      function publishLiveInsights() {

        if (cancelled) return;

        setTopFavoritedSong(

          rankContentByCounts(

            buildCountsFromRecords(favoriteRecords, "song"),

            songItems

          )

        );



        const sermonViews = buildCountsFromRecords(viewedRecords, "sermon");

        const sermonFavorites = buildCountsFromRecords(favoriteRecords, "sermon");

        setTopViewedSermon(

          rankContentByCounts(sermonViews, sermonItems) ??

            rankContentByCounts(sermonFavorites, sermonItems)

        );



        const articleViews = buildCountsFromRecords(viewedRecords, "article");

        const articleFavorites = buildCountsFromRecords(

          favoriteRecords,

          "article"

        );

        setTopReadArticle(

          rankContentByCounts(articleViews, articleItems) ??

            rankContentByCounts(articleFavorites, articleItems)

        );

      }



      void getDocs(collection(db, FAVORITES_COLLECTION))
        .then((snapshot) => {
          if (cancelled) return;
          favoriteRecords.length = 0;
          for (const docSnap of snapshot.docs) {
            const record = docSnap.data();
            const itemType = String(record.itemType ?? "");
            const itemId = String(record.itemId ?? "");
            if (itemType === "song" && allowedSongIds.has(itemId)) {
              favoriteRecords.push({ itemId, itemType });
            } else if (itemType === "sermon" && allowedSermonIds.has(itemId)) {
              favoriteRecords.push({ itemId, itemType });
            } else if (itemType === "article" && allowedArticleIds.has(itemId)) {
              favoriteRecords.push({ itemId, itemType });
            }
          }
          publishLiveInsights();
        })
        .catch(() => {
          // Engagement metrics unavailable without read access.
        });



      void getDocs(collection(db, RECENTLY_VIEWED_COLLECTION))
        .then((snapshot) => {
          if (cancelled) return;
          viewedRecords.length = 0;
          for (const docSnap of snapshot.docs) {
            const record = docSnap.data();
            const itemType = String(record.itemType ?? "");
            const itemId = String(record.itemId ?? "");
            if (itemType === "sermon" && allowedSermonIds.has(itemId)) {
              viewedRecords.push({ itemId, itemType });
            } else if (itemType === "article" && allowedArticleIds.has(itemId)) {
              viewedRecords.push({ itemId, itemType });
            }
          }
          publishLiveInsights();
        })
        .catch(() => {
          // Engagement metrics unavailable without read access.
        });

    }



    async function loadInsightsFromApi() {

      try {

        const currentUser = firebaseAuth.currentUser;

        if (!currentUser) {

          if (!cancelled) {

            setInsightsLoading(false);

          }

          return;

        }



        const token = await currentUser.getIdToken();

        const params = new URLSearchParams();

        if (churchScope?.trim()) {
          params.set("churchId", churchScope);
        }
        if (organizationScope?.trim()) {
          params.set("organizationId", organizationScope);
        }



        const response = await fetch(

          `/api/admin/analytics/insights?${params.toString()}`,

          {

            headers: {

              Authorization: `Bearer ${token}`,

            },

          }

        );



        if (response.status === 503) {

          if (!cancelled) {

            setAdminSdkUnavailable(true);

            if (apiActive) {

              startClientFallback(isSuperAdmin);

            } else if (!cancelled) {

              setInsightsLoading(false);

            }

          }

          return;

        }



        if (!response.ok) {

          if (!cancelled && apiActive) {

            startClientFallback(isSuperAdmin);

          }

          return;

        }



        const payload = (await response.json()) as AdminAnalyticsInsightsResponse;

        if (!cancelled) {

          setUsingInsightsApi(true);

          setAdminSdkUnavailable(false);

          applyInsightsPayload(payload);

        }

      } catch {

        if (!cancelled && apiActive) {

          startClientFallback(isSuperAdmin);

        }

      }

    }



    void loadInsightsFromApi();

    return () => {

      cancelled = true;

      clientUnsubscribes.forEach((unsubscribe) => unsubscribe());

    };

  }, [articleItems, churchScope, organizationScope, isSuperAdmin, refreshToken, sermonItems, songItems]);



  const completedDonations = useMemo(

    () => donations.filter((donation) => donation.paymentStatus === "completed"),

    [donations]

  );



  const monthlyDonations = useMemo(

    () => aggregateMonthlyDonations(completedDonations),

    [completedDonations]

  );



  const contentGrowth = useMemo(

    () => aggregateContentGrowth(songs, sermons, articles),

    [songs, sermons, articles]

  );



  const recentDonations = useMemo(

    () => [...donations].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8),

    [donations]

  );



  const recentPrayerRequests = useMemo(
    () => [...prayerRequests].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8),
    [prayerRequests]
  );

  const recentEvents = useMemo(
    () => [...events].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8),
    [events]
  );

  const scopeLabel = isSuperAdmin
    ? "Platform-wide"
    : churchScope
      ? "Church scope"
      : organizationScope
        ? "Organization scope"
        : "No church selected";



  return {

    loading,

    insightsLoading,

    adminSdkUnavailable,

    counts: {

      songs: songs.length,

      sermons: sermons.length,

      articles: articles.length,

      prayerRequests: prayerRequests.length,

      events: events.length,

      donations: completedDonations.length,

      users: userCount,

    },

    topFavoritedSong,

    topViewedSermon,

    topReadArticle,

    recentUsers,

    recentDonations,

    recentPrayerRequests,

    recentEvents,

    monthlyDonations,

    contentGrowth,

    scopeLabel,

    usingInsightsApi,

    refresh,
  };

}


