"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import type { FirebaseArticle } from "@/types/firebase-article";
import type { FirebaseChurch } from "@/types/firebase-church";
import type {
  FirebaseDonation,
  FirebaseDonationCampaign,
} from "@/types/firebase-donation";
import type { FirebaseEvent } from "@/types/firebase-event";
import type { FirebasePrayerRequest } from "@/types/firebase-prayer-request";
import type { FirebaseSermon } from "@/types/firebase-sermon";
import type { FirebaseSong } from "@/types/firebase-song";

import { normalizeArticleFromFirestore } from "@/lib/article-firestore";
import {
  CHURCHES_COLLECTION,
  normalizeChurchFromFirestore,
} from "@/lib/church-firestore";
import {
  useAdminChurchId,
  useIsPlatformSuperAdmin,
} from "@/hooks/use-admin-church-id";
import { useWorkspaceTenantScope } from "@/hooks/use-workspace-tenant-scope";
import {
  DONATION_CAMPAIGNS_COLLECTION,
  DONATIONS_COLLECTION,
  normalizeDonationCampaignFromFirestore,
  normalizeDonationFromFirestore,
} from "@/lib/donation-firestore";
import {
  EVENTS_COLLECTION,
  normalizeEventFromFirestore,
} from "@/lib/event-firestore";
import { MULTI_CHURCH_ENABLED } from "@/lib/feature-flags";
import { db } from "@/lib/firebase";
import { normalizePrayerRequestFromFirestore } from "@/lib/prayer-request-firestore";
import {
  MEMBERS_LIST_LIMIT,
  QUERY_GC_TIME,
  QUERY_STALE_TIME,
} from "@/lib/react-query-config";
import {
  LEGACY_SERMONS_COLLECTION,
  SERMONS_COLLECTION,
  mergeSermonsById,
  normalizeSermonFromFirestore,
} from "@/lib/sermon-firestore";
import { normalizeSongFromFirestore } from "@/lib/song-firestore";

import { useTenantListQuery } from "./use-tenant-list-query";
import { normalizeUserCreatedAt } from "@/lib/admin-analytics-utils";

type CollectionState<T> = {
  data: T[];
  loading: boolean;
  error: string | null;
  loadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
};

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: number;
};

function mapUserDocToRow(id: string, data: Record<string, unknown>): AdminUserRow {
  const firstName = String(data.firstName ?? "").trim();
  const lastName = String(data.lastName ?? "").trim();
  const name = [firstName, lastName].filter(Boolean).join(" ") || "Member";

  return {
    id,
    name,
    email: String(data.email ?? "").trim(),
    role: String(data.role ?? "user").trim(),
    createdAt: normalizeUserCreatedAt(data.createdAt),
  };
}

export function useAdminSongs(): CollectionState<FirebaseSong> {
  return useTenantListQuery({
    queryKey: "admin-songs",
    collectionName: "songs",
    orderField: "createdAt",
    normalize: normalizeSongFromFirestore,
  });
}

export function useAdminSermons(): CollectionState<FirebaseSermon> {
  const primary = useTenantListQuery({
    queryKey: "admin-sermons",
    collectionName: SERMONS_COLLECTION,
    orderField: "dateCreated",
    normalize: normalizeSermonFromFirestore,
  });
  const legacy = useTenantListQuery({
    queryKey: "admin-sermons-legacy",
    collectionName: LEGACY_SERMONS_COLLECTION,
    orderField: "dateCreated",
    normalize: normalizeSermonFromFirestore,
  });

  const data = useMemo(
    () => mergeSermonsById([primary.data, legacy.data]),
    [primary.data, legacy.data]
  );

  return {
    data,
    loading: primary.loading || legacy.loading,
    error: primary.error ?? legacy.error,
    loadMore: () => {
      void primary.loadMore();
      void legacy.loadMore();
    },
    hasMore: primary.hasMore || legacy.hasMore,
    loadingMore: primary.loadingMore || legacy.loadingMore,
  };
}

export function useAdminArticles(): CollectionState<FirebaseArticle> {
  return useTenantListQuery({
    queryKey: "admin-articles",
    collectionName: "articles",
    orderField: "dateCreated",
    normalize: normalizeArticleFromFirestore,
  });
}

export function useAdminEvents(): CollectionState<FirebaseEvent> {
  return useTenantListQuery({
    queryKey: "admin-events",
    collectionName: EVENTS_COLLECTION,
    orderField: "eventDate",
    orderDirection: "desc",
    normalize: normalizeEventFromFirestore,
  });
}

export function useAdminDonations(): {
  campaigns: FirebaseDonationCampaign[];
  donations: FirebaseDonation[];
  loading: boolean;
  error: string | null;
  loadMore?: () => void;
  hasMore?: boolean;
} {
  const campaigns = useTenantListQuery({
    queryKey: "admin-donation-campaigns",
    collectionName: DONATION_CAMPAIGNS_COLLECTION,
    orderField: "createdAt",
    normalize: normalizeDonationCampaignFromFirestore,
  });
  const donations = useTenantListQuery({
    queryKey: "admin-donations",
    collectionName: DONATIONS_COLLECTION,
    orderField: "createdAt",
    normalize: normalizeDonationFromFirestore,
  });

  return {
    campaigns: campaigns.data,
    donations: donations.data,
    loading: campaigns.loading || donations.loading,
    error: campaigns.error ?? donations.error,
    loadMore: () => {
      void campaigns.loadMore();
      void donations.loadMore();
    },
    hasMore: campaigns.hasMore || donations.hasMore,
  };
}

export function useAdminPrayerRequests(): CollectionState<FirebasePrayerRequest> {
  return useTenantListQuery({
    queryKey: "admin-prayer-requests",
    collectionName: "prayerRequests",
    orderField: "createdAt",
    churchScopeOnly: true,
    normalize: normalizePrayerRequestFromFirestore,
  });
}

export function useAdminChurches(): CollectionState<FirebaseChurch> {
  const isSuperAdmin = useIsPlatformSuperAdmin();

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["admin-churches"],
    enabled: MULTI_CHURCH_ENABLED && isSuperAdmin,
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    queryFn: async () => {
      const churchesQuery = query(
        collection(db, CHURCHES_COLLECTION),
        orderBy("name", "asc"),
        limit(50)
      );
      const snapshot = await getDocs(churchesQuery);
      return snapshot.docs.map((docSnap) =>
        normalizeChurchFromFirestore(
          docSnap.id,
          docSnap.data() as Record<string, unknown>
        )
      );
    },
  });

  return {
    data,
    loading: isLoading,
    error: error ? "Unable to sync data. Please refresh and try again." : null,
  };
}

export function useAdminUsers() {
  const adminChurchId = useAdminChurchId();
  const isSuperAdmin = useIsPlatformSuperAdmin();
  const churchScope = isSuperAdmin ? null : adminChurchId?.trim() || null;

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-users", churchScope, isSuperAdmin],
    enabled: isSuperAdmin || Boolean(churchScope),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    queryFn: async () => {
      const usersCollection = collection(db, "users");
      const usersQuery = churchScope
        ? query(
            usersCollection,
            where("churchId", "==", churchScope),
            orderBy("createdAt", "desc"),
            limit(MEMBERS_LIST_LIMIT)
          )
        : query(
            usersCollection,
            orderBy("createdAt", "desc"),
            limit(MEMBERS_LIST_LIMIT)
          );
      const snapshot = await getDocs(usersQuery);
      return snapshot.docs.map((docSnap) =>
        mapUserDocToRow(docSnap.id, docSnap.data() as Record<string, unknown>)
      );
    },
  });

  return { users: data, loading: isLoading };
}

export function useAdminChurchBlocked(): boolean {
  const scope = useWorkspaceTenantScope();
  const isSuperAdmin = useIsPlatformSuperAdmin();
  return scope.blocked && !isSuperAdmin;
}

export { useAdminChurchId, useIsPlatformSuperAdmin };
