"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { DonationCampaignList } from "@/components/admin/donation-campaign-list";
import { AdminChurchNotice } from "@/components/admin/admin-church-notice";
import { AdminListPagination } from "@/components/admin/admin-list-pagination";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminToolbar } from "@/components/admin/admin-toolbar";
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
  useAdminDonations,
} from "@/hooks/use-admin-collections";
import { useInvalidateAdminQueries } from "@/hooks/use-invalidate-admin-queries";
import { filterBySearch, paginateItems } from "@/lib/admin-list-utils";
import { downloadDonationsCsv } from "@/lib/donation-export";
import { Button } from "@/components/ui/button";
import type { FirebaseDonationCampaign } from "@/types/firebase-donation";

const AddDonationCampaignModal = dynamic(
  () =>
    import("@/components/admin/add-donation-campaign-modal").then(
      (mod) => mod.AddDonationCampaignModal
    ),
  { ssr: false }
);

type CampaignStatusFilter = "all" | FirebaseDonationCampaign["status"];

export function AdminDonationsPageClient({ embedded = false }: { embedded?: boolean }) {
  const searchParams = useSearchParams();
  const adminChurchId = useAdminChurchId();
  const blocked = useAdminChurchBlocked();
  const { campaigns, donations, loading } = useAdminDonations();
  const { invalidateDonations } = useInvalidateAdminQueries();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] =
    useState<FirebaseDonationCampaign | null>(null);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setSelectedCampaign(null);
      setModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const filteredCampaigns = useMemo(() => {
    const searched = filterBySearch(campaigns, search, (campaign) =>
      [campaign.title, campaign.description].filter(Boolean).join(" ")
    );
    if (statusFilter === "all") return searched;
    return searched.filter((campaign) => campaign.status === statusFilter);
  }, [campaigns, search, statusFilter]);

  const { pageItems, totalPages, safePage } = useMemo(
    () => paginateItems(filteredCampaigns, page),
    [filteredCampaigns, page]
  );

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [safePage, page]);

  function handleExportCsv() {
    if (!adminChurchId) {
      toast.error("Select a church before exporting donations.");
      return;
    }

    if (donations.length === 0) {
      toast.message("No donations to export yet.");
      return;
    }

    downloadDonationsCsv(donations, campaigns, adminChurchId);
    toast.success(`Exported ${donations.length} donation record(s).`);
  }

  return (
    <div className={embedded ? "space-y-4" : adminSectionClass}>
      {!embedded ?
        <AdminPageHeader
          title="Donations"
          description="Manage giving campaigns and track gifts"
          actionLabel="Create Campaign"
          onAction={() => {
            setSelectedCampaign(null);
            setModalOpen(true);
          }}
          actionDisabled={blocked}
        />
      : null}

      {blocked ? <AdminChurchNotice /> : null}

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search campaigns…"
        actionLabel={embedded ? "Create Campaign" : undefined}
        onAction={
          embedded ?
            () => {
              setSelectedCampaign(null);
              setModalOpen(true);
            }
          : undefined
        }
        actionDisabled={blocked}
      >
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as CampaignStatusFilter)}
        >
          <SelectTrigger className="w-full min-w-0 sm:w-[8.75rem] rounded-full">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-full sm:w-auto"
          disabled={blocked || loading || donations.length === 0}
          onClick={handleExportCsv}
        >
          <Download className="mr-2 size-4" />
          Export CSV
        </Button>
      </AdminToolbar>

      <DonationCampaignList
        campaigns={pageItems}
        recentDonations={donations.slice(0, 10)}
        loading={loading}
        onEdit={(campaign) => {
          setSelectedCampaign(campaign);
          setModalOpen(true);
        }}
        onDelete={() => void invalidateDonations()}
      />

      <AdminListPagination
        page={safePage}
        totalPages={totalPages}
        totalItems={filteredCampaigns.length}
        onPageChange={setPage}
      />

      <AddDonationCampaignModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedCampaign(null);
        }}
        onSave={() => {
          setModalOpen(false);
          setSelectedCampaign(null);
        }}
        initialCampaign={selectedCampaign}
        churchId={adminChurchId ?? ""}
      />
    </div>
  );
}
