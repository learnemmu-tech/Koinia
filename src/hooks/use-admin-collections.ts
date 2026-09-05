"use client";

import { useQuery } from "@tanstack/react-query";

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

import {
  useAdminChurchId,
  useIsPlatformSuperAdmin,
} from "@/hooks/use-admin-church-id";
import { useWorkspaceTenantScope } from "@/hooks/use-workspace-tenant-scope";
import { fetchTenantContentPage } from "@/lib/api-client";
import { MULTI_CHURCH_ENABLED } from "@/lib/feature-flags";
import {
  QUERY_GC_TIME,
  QUERY_STALE_TIME,
} from "@/lib/react-query-config";

import { useTenantListQuery } from "./use-tenant-list-query";

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

export function useAdminSongs(): CollectionState<FirebaseSong> {
  return useTenantListQuery({
    queryKey: "admin-songs",
    collectionName: "songs",
    orderField: "createdAt",
  });
}

export function useAdminSermons(): CollectionState<FirebaseSermon> {
  return useTenantListQuery({
    queryKey: "admin-sermons",
    collectionName: "sermons",
    orderField: "dateCreated",
  });
}

export function useAdminArticles(): CollectionState<FirebaseArticle> {
  return useTenantListQuery({
    queryKey: "admin-articles",
    collectionName: "articles",
    orderField: "dateCreated",
  });
}

export function useAdminEvents(): CollectionState<FirebaseEvent> {
  return useTenantListQuery({
    queryKey: "admin-events",
    collectionName: "events",
    orderField: "eventDate",
    orderDirection: "desc",
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
  const campaigns = useTenantListQuery<FirebaseDonationCampaign>({
    queryKey: "admin-donation-campaigns",
    collectionName: "donationCampaigns",
    orderField: "createdAt",
  });
  const donations = useTenantListQuery<FirebaseDonation>({
    queryKey: "admin-donations",
    collectionName: "donations",
    orderField: "createdAt",
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
      const page = await fetchTenantContentPage<FirebaseChurch>({
        collection: "churches",
        limit: 50,
      });
      return page.items;
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
  const churchScope = isSuperAdmin ? undefined : adminChurchId?.trim() || undefined;

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-users", churchScope, isSuperAdmin],
    enabled: isSuperAdmin || Boolean(churchScope),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    queryFn: async () => {
      const page = await fetchTenantContentPage<AdminUserRow>({
        collection: "users",
        churchId: churchScope,
        limit: 50,
      });
      return page.items;
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
