"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { FirebaseArticle } from "@/types/firebase-article";
import type { FirebaseDonation } from "@/types/firebase-donation";
import type { FirebaseEvent } from "@/types/firebase-event";
import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";
import type { FirebaseSermon } from "@/types/firebase-sermon";
import type { FirebaseSong } from "@/types/firebase-song";

import {
  aggregateContentGrowth,
  aggregateMonthlyDonations,
  type RankedContentInsight,
  type RecentUserRow,
} from "@/lib/admin-analytics-utils";
import { loadAdminAnalyticsCollections } from "@/lib/admin-analytics-load";
import { firebaseAuth } from "@/lib/firebase-auth-service";
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
  monthlyDonations: ReturnType<typeof aggregateMonthlyDonations>;
  contentGrowth: ReturnType<typeof aggregateContentGrowth>;
  scopeLabel: string;
  usingInsightsApi: boolean;
  refresh: () => void;
};

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
  const [refreshToken, setRefreshToken] = useState(0);

  const refresh = useCallback(() => {
    setInsightsLoading(true);
    setRefreshToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!isSuperAdmin && !churchScope && !organizationScope) {
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

    void loadAdminAnalyticsCollections(churchScope, organizationScope)
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
  }, [churchScope, organizationScope, isSuperAdmin, refreshToken]);

  useEffect(() => {
    if (!isSuperAdmin && !churchScope && !organizationScope) {
      setInsightsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadInsightsFromApi() {
      try {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) {
          if (!cancelled) setInsightsLoading(false);
          return;
        }

        const token = await currentUser.getIdToken();
        const params = new URLSearchParams();
        if (churchScope?.trim()) params.set("churchId", churchScope);
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

        if (!response.ok) {
          if (!cancelled) setInsightsLoading(false);
          return;
        }

        const payload = (await response.json()) as AdminAnalyticsInsightsResponse;
        if (cancelled) return;

        setUsingInsightsApi(true);
        setTopFavoritedSong(payload.topFavoritedSong);
        setTopViewedSermon(payload.topViewedSermon);
        setTopReadArticle(payload.topReadArticle);
        setRecentUsers(payload.recentUsers);
        setUserCount(payload.userCount);
        setInsightsLoading(false);
      } catch {
        if (!cancelled) setInsightsLoading(false);
      }
    }

    void loadInsightsFromApi();

    return () => {
      cancelled = true;
    };
  }, [churchScope, organizationScope, isSuperAdmin, refreshToken]);

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
    adminSdkUnavailable: false,
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
