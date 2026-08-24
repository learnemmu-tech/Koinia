"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

import { EventList } from "@/components/admin/event-list";
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
  useAdminEvents,
} from "@/hooks/use-admin-collections";
import { useInvalidateAdminQueries } from "@/hooks/use-invalidate-admin-queries";
import { filterBySearch, paginateItems } from "@/lib/admin-list-utils";
import type { FirebaseEvent } from "@/types/firebase-event";

const AddEventModal = dynamic(
  () =>
    import("@/components/admin/add-event-modal").then((mod) => mod.AddEventModal),
  { ssr: false }
);

type EventStatusFilter = "all" | FirebaseEvent["status"];

export function AdminEventsPageClient({ embedded = false }: { embedded?: boolean }) {
  const searchParams = useSearchParams();
  const adminChurchId = useAdminChurchId();
  const blocked = useAdminChurchBlocked();
  const { data: events, loading, loadMore, hasMore, loadingMore } =
    useAdminEvents();
  const { invalidateEvents } = useInvalidateAdminQueries();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EventStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<FirebaseEvent | null>(null);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setSelectedEvent(null);
      setModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const filteredEvents = useMemo(() => {
    const searched = filterBySearch(events, search, (event) =>
      [event.title, event.location, event.description].filter(Boolean).join(" ")
    );
    if (statusFilter === "all") return searched;
    return searched.filter((event) => event.status === statusFilter);
  }, [events, search, statusFilter]);

  const { pageItems, totalPages, safePage } = useMemo(
    () => paginateItems(filteredEvents, page),
    [filteredEvents, page]
  );

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [safePage, page]);

  return (
    <div className={embedded ? "space-y-4" : adminSectionClass}>
      {!embedded ?
        <AdminPageHeader
          title="Events"
          description="Manage church events and registrations"
          actionLabel="Create Event"
          onAction={() => {
            setSelectedEvent(null);
            setModalOpen(true);
          }}
          actionDisabled={blocked}
        />
      : null}

      {blocked ? <AdminChurchNotice /> : null}

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search events…"
        actionLabel={embedded ? "Create Event" : undefined}
        onAction={
          embedded ?
            () => {
              setSelectedEvent(null);
              setModalOpen(true);
            }
          : undefined
        }
        actionDisabled={blocked}
      >
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as EventStatusFilter)}
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

      <EventList
        events={pageItems}
        loading={loading}
        onEdit={(event) => {
          setSelectedEvent(event);
          setModalOpen(true);
        }}
        onDelete={() => void invalidateEvents()}
      />

      <AdminListPagination
        page={safePage}
        totalPages={totalPages}
        totalItems={filteredEvents.length}
        onPageChange={setPage}
      />

      <ContentLoadMore
        hasMore={hasMore}
        loading={loadingMore}
        onLoadMore={loadMore}
      />

      <AddEventModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedEvent(null);
        }}
        onSave={() => {
          setModalOpen(false);
          setSelectedEvent(null);
        }}
        initialEvent={selectedEvent}
        churchId={adminChurchId ?? ""}
      />
    </div>
  );
}
