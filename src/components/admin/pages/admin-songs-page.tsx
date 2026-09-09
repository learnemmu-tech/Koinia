"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { AddMusicModal } from "@/components/admin/add-music-modal";
import { MusicList } from "@/components/admin/music-list";
import { AdminChurchNotice } from "@/components/admin/admin-church-notice";
import { WorkspaceChurchRequiredNotice } from "@/components/workspace/workspace-church-required-notice";
import { useOrganization } from "@/context/organization-context";
import { isMultiChurchOrgWorkspace } from "@/lib/organization/workspace-type";
import { AdminListPagination } from "@/components/admin/admin-list-pagination";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminToolbar } from "@/components/admin/admin-toolbar";
import { FetchErrorBanner } from "@/components/ui/fetch-error-banner";
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
  useAdminSongs,
} from "@/hooks/use-admin-collections";
import { useInvalidateAdminQueries } from "@/hooks/use-invalidate-admin-queries";
import {
  filterByPublishStatus,
  filterBySearch,
  paginateItems,
  type PublishFilter,
} from "@/lib/admin-list-utils";
import type { FirebaseSong } from "@/types/firebase-song";
import {
  getSongAlternateTitle,
  getSongDisplayTitle,
} from "@/lib/song-firestore";

export function AdminSongsPageClient({ embedded = false }: { embedded?: boolean }) {
  const t = useTranslations("songs");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const { organization } = useOrganization();
  const adminChurchId = useAdminChurchId();
  const blocked = useAdminChurchBlocked();
  const { data: songs, loading, error, loadMore, hasMore, loadingMore } =
    useAdminSongs();
  const { invalidateSongs } = useInvalidateAdminQueries();

  const [search, setSearch] = useState("");
  const [publishFilter, setPublishFilter] = useState<PublishFilter>("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<FirebaseSong | null>(null);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setSelectedSong(null);
      setModalOpen(true);
      return;
    }

    const editId = searchParams.get("edit")?.trim();
    if (!editId || loading) return;

    const song = songs.find((item) => item.id === editId);
    if (song) {
      setSelectedSong(song);
      setModalOpen(true);
    }
  }, [searchParams, songs, loading]);

  useEffect(() => {
    setPage(1);
  }, [search, publishFilter]);

  const filteredSongs = useMemo(() => {
    const searched = filterBySearch(songs, search, (song) =>
      [getSongDisplayTitle(song), getSongAlternateTitle(song), song.category]
        .filter(Boolean)
        .join(" ")
    );
    return filterByPublishStatus(
      searched,
      publishFilter,
      (song) => song.published !== false
    );
  }, [songs, search, publishFilter]);

  const { pageItems, totalPages, safePage } = useMemo(
    () => paginateItems(filteredSongs, page),
    [filteredSongs, page]
  );

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [safePage, page]);

  return (
    <div className={embedded ? "space-y-4" : adminSectionClass}>
      {!embedded ?
        <AdminPageHeader
          title={t("title")}
          description={t("adminDescription")}
          actionLabel={t("add")}
          onAction={() => {
            setSelectedSong(null);
            setModalOpen(true);
          }}
          actionDisabled={blocked}
        />
      : null}

      {blocked ?
        isMultiChurchOrgWorkspace(organization) ?
          <WorkspaceChurchRequiredNotice />
        : <AdminChurchNotice />
      : null}

      {error ?
        <FetchErrorBanner message={error} />
      : null}

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("searchPlaceholder")}
        actionLabel={embedded ? t("add") : undefined}
        onAction={
          embedded ?
            () => {
              setSelectedSong(null);
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
            <SelectValue placeholder={tCommon("filter")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tCommon("all")}</SelectItem>
            <SelectItem value="published">{tCommon("published")}</SelectItem>
            <SelectItem value="draft">{tCommon("draft")}</SelectItem>
          </SelectContent>
        </Select>
      </AdminToolbar>

      <MusicList
        songs={pageItems}
        loading={loading}
        onEdit={(song) => {
          setSelectedSong(song);
          setModalOpen(true);
        }}
        onDelete={() => void invalidateSongs()}
      />

      <AdminListPagination
        page={safePage}
        totalPages={totalPages}
        totalItems={filteredSongs.length}
        onPageChange={setPage}
      />

      <ContentLoadMore
        hasMore={hasMore}
        loading={loadingMore}
        onLoadMore={loadMore}
      />

      <AddMusicModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedSong(null);
        }}
        onSave={() => {
          setModalOpen(false);
          setSelectedSong(null);
        }}
        initialSong={selectedSong}
        churchId={adminChurchId ?? ""}
      />
    </div>
  );
}
