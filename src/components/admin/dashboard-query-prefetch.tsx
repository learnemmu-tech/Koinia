"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAdminChurchId } from "@/hooks/use-admin-church-id";
import { useIsPlatformSuperAdmin } from "@/hooks/use-admin-church-id";
import { QUERY_STALE_TIME } from "@/lib/react-query-config";

/** Prefetch common admin lists when dashboard mounts. */
export function DashboardQueryPrefetch() {
  const queryClient = useQueryClient();
  const churchId = useAdminChurchId();
  const isSuperAdmin = useIsPlatformSuperAdmin();

  useEffect(() => {
    if (!churchId && !isSuperAdmin) return;

    void queryClient.prefetchQuery({
      queryKey: ["admin-songs", churchId],
      staleTime: QUERY_STALE_TIME,
    });
    void queryClient.prefetchQuery({
      queryKey: ["admin-users", isSuperAdmin ? null : churchId, isSuperAdmin],
      staleTime: QUERY_STALE_TIME,
    });
    void queryClient.prefetchQuery({
      queryKey: ["admin-prayer-requests", churchId],
      staleTime: QUERY_STALE_TIME,
    });
  }, [queryClient, churchId, isSuperAdmin]);

  return null;
}
