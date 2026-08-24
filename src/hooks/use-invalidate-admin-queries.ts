"use client";

import { useQueryClient } from "@tanstack/react-query";

import { useAdminChurchId } from "@/hooks/use-admin-church-id";

/** Invalidate React Query caches after admin mutations. */
export function useInvalidateAdminQueries() {
  const queryClient = useQueryClient();
  const churchId = useAdminChurchId();

  return {
    invalidateSongs: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-songs"] });
      await queryClient.invalidateQueries({ queryKey: ["content-songs"] });
    },
    invalidateSermons: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-sermons"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-sermons-legacy"] });
      await queryClient.invalidateQueries({ queryKey: ["content-sermons"] });
      await queryClient.invalidateQueries({ queryKey: ["content-sermons-legacy"] });
    },
    invalidateArticles: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      await queryClient.invalidateQueries({ queryKey: ["content-articles"] });
    },
    invalidateEvents: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      await queryClient.invalidateQueries({ queryKey: ["published-events"] });
    },
    invalidatePrayers: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-prayer-requests"] });
      await queryClient.invalidateQueries({ queryKey: ["approved-prayers"] });
    },
    invalidateMembers: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users", churchScopeKey(churchId)] });
    },
    invalidateDonations: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-donation-campaigns"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-donations"] });
      await queryClient.invalidateQueries({ queryKey: ["active-donation-campaigns"] });
    },
    invalidateAllContent: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-songs"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-sermons"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-sermons-legacy"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-articles"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-events"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-prayer-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-donation-campaigns"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-donations"] }),
        queryClient.invalidateQueries({ queryKey: ["content-songs"] }),
        queryClient.invalidateQueries({ queryKey: ["content-sermons"] }),
        queryClient.invalidateQueries({ queryKey: ["content-articles"] }),
        queryClient.invalidateQueries({ queryKey: ["published-events"] }),
        queryClient.invalidateQueries({ queryKey: ["approved-prayers"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-analytics"] }),
      ]);
    },
  };
}

function churchScopeKey(churchId: string | null | undefined) {
  return churchId?.trim() || null;
}
