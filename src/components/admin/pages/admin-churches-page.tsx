"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";

import { ChurchList } from "@/components/admin/church-list";
import { AdminListPagination } from "@/components/admin/admin-list-pagination";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminToolbar } from "@/components/admin/admin-toolbar";
import { adminSectionClass } from "@/lib/responsive-classes";
import { useAdminChurches } from "@/hooks/use-admin-collections";
import { filterBySearch, paginateItems } from "@/lib/admin-list-utils";
import type { FirebaseChurch } from "@/types/firebase-church";

const AddChurchModal = dynamic(
  () =>
    import("@/components/admin/add-church-modal").then(
      (mod) => mod.AddChurchModal
    ),
  { ssr: false }
);

export function AdminChurchesPageClient() {
  const { data: churches, loading } = useAdminChurches();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedChurch, setSelectedChurch] = useState<FirebaseChurch | null>(
    null
  );

  const filteredChurches = useMemo(
    () =>
      filterBySearch(churches, search, (church) =>
        [church.name, church.slug, church.city, church.country]
          .filter(Boolean)
          .join(" ")
      ),
    [churches, search]
  );

  const { pageItems, totalPages, safePage } = useMemo(
    () => paginateItems(filteredChurches, page),
    [filteredChurches, page]
  );

  return (
    <div className={adminSectionClass}>
      <AdminPageHeader
        title="Churches"
        description="Manage churches on the platform"
        actionLabel="Add Church"
        onAction={() => {
          setSelectedChurch(null);
          setModalOpen(true);
        }}
      />

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search churches…"
      />

      <ChurchList
        churches={pageItems}
        loading={loading}
        onEdit={(church) => {
          setSelectedChurch(church);
          setModalOpen(true);
        }}
        onChanged={() => {}}
      />

      <AdminListPagination
        page={safePage}
        totalPages={totalPages}
        totalItems={filteredChurches.length}
        onPageChange={setPage}
      />

      <AddChurchModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedChurch(null);
        }}
        onSave={() => {
          setModalOpen(false);
          setSelectedChurch(null);
        }}
        initialChurch={selectedChurch}
      />
    </div>
  );
}
