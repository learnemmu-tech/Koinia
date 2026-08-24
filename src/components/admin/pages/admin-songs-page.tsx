"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

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

const AddMusicModal = dynamic(
  () =>
    import("@/components/admin/add-music-modal").then((mod) => mod.AddMusicModal),
  { ssr: false }
);

export function AdminSongsPageClient({ embedded = false }: { embedded?: boolean }) {
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
          title="Songs"
          description="Manage worship songs, lyrics, and audio"
          actionLabel="Add Song"
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
        searchPlaceholder="Search songs…"
        actionLabel={embedded ? "Add Song" : undefined}
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
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
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
