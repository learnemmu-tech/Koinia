"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

import { SermonList } from "@/components/admin/sermon-list";
import { AdminChurchNotice } from "@/components/admin/admin-church-notice";
import { AdminListPagination } from "@/components/admin/admin-list-pagination";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminToolbar } from "@/components/admin/admin-toolbar";
import { ContentLoadMore } from "@/components/ui/content-load-more";
import { adminSectionClass } from "@/lib/responsive-classes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAdminChurchBlocked,
  useAdminChurchId,
  useAdminSermons,
} from "@/hooks/use-admin-collections";
import { useInvalidateAdminQueries } from "@/hooks/use-invalidate-admin-queries";
import {
  filterByPublishStatus,
  filterBySearch,
  paginateItems,
  type PublishFilter,
} from "@/lib/admin-list-utils";
import type { FirebaseSermon } from "@/types/firebase-sermon";

const AddSermonModal = dynamic(
  () =>
    import("@/components/admin/add-sermon-modal").then((mod) => mod.AddSermonModal),
  { ssr: false }
);

export function AdminSermonsPageClient({ embedded = false }: { embedded?: boolean }) {
  const searchParams = useSearchParams();
  const adminChurchId = useAdminChurchId();
  const blocked = useAdminChurchBlocked();
  const { data: sermons, loading, loadMore, hasMore, loadingMore } =
    useAdminSermons();
  const { invalidateSermons } = useInvalidateAdminQueries();

  const [search, setSearch] = useState("");
  const [publishFilter, setPublishFilter] = useState<PublishFilter>("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSermon, setSelectedSermon] = useState<FirebaseSermon | null>(
    null
  );

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setSelectedSermon(null);
      setModalOpen(true);
      return;
    }

    const editId = searchParams.get("edit")?.trim();
    if (!editId || loading) return;

    const sermon = sermons.find((item) => item.id === editId);
    if (sermon) {
      setSelectedSermon(sermon);
      setModalOpen(true);
    }
  }, [searchParams, sermons, loading]);

  useEffect(() => {
    setPage(1);
  }, [search, publishFilter]);

  const filteredSermons = useMemo(() => {
    const searched = filterBySearch(sermons, search, (sermon) =>
      [sermon.title, sermon.speaker, sermon.shortDescription]
        .filter(Boolean)
        .join(" ")
    );
    return filterByPublishStatus(
      searched,
      publishFilter,
      (sermon) => sermon.isPublished
    );
  }, [sermons, search, publishFilter]);

  const { pageItems, totalPages, safePage } = useMemo(
    () => paginateItems(filteredSermons, page),
    [filteredSermons, page]
  );

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [safePage, page]);

  return (
    <div className={embedded ? "space-y-4" : adminSectionClass}>
      {!embedded ?
        <AdminPageHeader
          title="Sermons"
          description="Manage sermon library and publishing"
          actionLabel="Add Sermon"
          onAction={() => {
            setSelectedSermon(null);
            setModalOpen(true);
          }}
          actionDisabled={blocked}
        />
      : null}

      {blocked ? <AdminChurchNotice /> : null}

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search sermons…"
        actionLabel={embedded ? "Add Sermon" : undefined}
        onAction={
          embedded ?
            () => {
              setSelectedSermon(null);
              setModalOpen(true);
            }
          : undefined
        }
        actionDisabled={blocked}
      >
        <Select
          value={publishFilter}
          onValueChange={(value) => setPublishFilter(value as PublishFilter)}
        >
          <SelectTrigger className="w-full min-w-0 sm:w-[8.75rem] rounded-full">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </AdminToolbar>

      <SermonList
        sermons={pageItems}
        loading={loading}
        onEdit={(sermon) => {
          setSelectedSermon(sermon);
          setModalOpen(true);
        }}
        onDelete={() => void invalidateSermons()}
      />

      <AdminListPagination
        page={safePage}
        totalPages={totalPages}
        totalItems={filteredSermons.length}
        onPageChange={setPage}
      />

      <ContentLoadMore
        hasMore={hasMore}
        loading={loadingMore}
        onLoadMore={loadMore}
      />

      <AddSermonModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedSermon(null);
        }}
        onSave={() => {
          setModalOpen(false);
          setSelectedSermon(null);
        }}
        initialSermon={selectedSermon}
        churchId={adminChurchId ?? ""}
      />
    </div>
  );
}
