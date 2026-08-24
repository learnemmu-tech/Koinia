"use client";

import { useMemo, useState } from "react";

import { PrayerRequestList } from "@/components/admin/prayer-request-list";
import { AdminChurchNotice } from "@/components/admin/admin-church-notice";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminToolbar } from "@/components/admin/admin-toolbar";
import { ContentLoadMore } from "@/components/ui/content-load-more";
import { adminSectionClass } from "@/lib/responsive-classes";
import {
  useAdminChurchBlocked,
  useAdminPrayerRequests,
} from "@/hooks/use-admin-collections";
import { filterBySearch } from "@/lib/admin-list-utils";
import { getPrayerRequestDisplayName } from "@/lib/prayer-request-firestore";

export function AdminPrayersPageClient({ embedded = false }: { embedded?: boolean }) {
  const blocked = useAdminChurchBlocked();
  const { data: requests, loading, loadMore, hasMore, loadingMore } =
    useAdminPrayerRequests();
  const [search, setSearch] = useState("");

  const filteredRequests = useMemo(
    () =>
      filterBySearch(requests, search, (request) =>
        [
          request.title,
          request.request,
          getPrayerRequestDisplayName(request),
        ]
          .filter(Boolean)
          .join(" ")
      ),
    [requests, search]
  );

  return (
    <div className={embedded ? "space-y-4" : adminSectionClass}>
      {!embedded ?
        <AdminPageHeader
          title="Prayer Requests"
          description="Review, approve, and manage community prayer requests"
        />
      : null}

      {blocked ? <AdminChurchNotice /> : null}

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search prayer requests…"
      />

      <PrayerRequestList requests={filteredRequests} loading={loading} />

      <ContentLoadMore
        hasMore={hasMore}
        loading={loadingMore}
        onLoadMore={loadMore}
      />
    </div>
  );
}
