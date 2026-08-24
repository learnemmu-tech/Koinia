"use client";

import { useState } from "react";
import { Edit2, HeartHandshake, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { FirebaseDonation, FirebaseDonationCampaign } from "@/types/firebase-donation";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEFAULT_SONG_COVER } from "@/config/site";
import {
  deleteDonationCampaign,
  setDonationCampaignStatus,
} from "@/lib/donation-campaign-mutations";
import {
  formatDonationAmount,
  getCampaignProgressPercent,
} from "@/lib/donation-firestore";
import { getSongCoverUrl } from "@/lib/utils";

type DonationCampaignListProps = {
  campaigns: FirebaseDonationCampaign[];
  recentDonations: FirebaseDonation[];
  loading: boolean;
  onEdit: (campaign: FirebaseDonationCampaign) => void;
  onDelete: () => void;
};

export function DonationCampaignList({
  campaigns,
  recentDonations,
  loading,
  onEdit,
  onDelete,
}: DonationCampaignListProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<FirebaseDonationCampaign | null>(null);

  async function handleConfirmDelete() {
    if (!selected) return;
    setDeleting(selected.id);
    try {
      await deleteDonationCampaign(selected.id);
      toast.success("Campaign deleted");
      onDelete();
    } catch {
      toast.error("Failed to delete campaign");
    } finally {
      setDeleting(null);
      setDeleteConfirmOpen(false);
      setSelected(null);
    }
  }

  async function handleToggleStatus(campaign: FirebaseDonationCampaign) {
    setUpdating(campaign.id);
    try {
      const nextStatus = campaign.status === "active" ? "inactive" : "active";
      await setDonationCampaignStatus(campaign.id, nextStatus);
      toast.success(
        nextStatus === "active" ? "Campaign activated" : "Campaign deactivated"
      );
    } catch {
      toast.error("Failed to update campaign status");
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 className="h-7 w-7 animate-spin text-primary/60" />
          <p className="text-sm text-muted-foreground">Loading campaigns…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="border-b border-border/50 bg-muted/30 px-4 py-3 sm:px-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Campaigns
          </p>
        </div>

        {campaigns.length === 0 ?
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <HeartHandshake className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-medium">No campaigns have been created for this church yet.</p>
          </div>
        : <div className="divide-y divide-border/40">
            {campaigns.map((campaign) => {
              const coverSrc = getSongCoverUrl(campaign.bannerImage);
              const progress = getCampaignProgressPercent(campaign);

              return (
                <div
                  key={campaign.id}
                  className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5"
                >
                  <img
                    src={coverSrc || DEFAULT_SONG_COVER}
                    alt={campaign.title}
                    className="h-20 w-32 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">{campaign.title}</h3>
                      <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {campaign.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDonationAmount(campaign.currentAmount, campaign.currency)} raised
                      {" · "}
                      {progress}% of{" "}
                      {formatDonationAmount(campaign.targetAmount, campaign.currency)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updating === campaign.id}
                      onClick={() => handleToggleStatus(campaign)}
                    >
                      {campaign.status === "active" ? "Deactivate" : "Activate"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onEdit(campaign)}>
                      <Edit2 className="mr-1 size-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={deleting === campaign.id}
                      onClick={() => {
                        setSelected(campaign);
                        setDeleteConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="mr-1 size-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        }
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="border-b border-border/50 bg-muted/30 px-4 py-3 sm:px-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Recent Donations
          </p>
        </div>
        {recentDonations.length === 0 ?
          <p className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-6">
            No donations recorded yet.
          </p>
        : <div className="divide-y divide-border/40">
            {recentDonations.map((donation) => (
              <div
                key={donation.id}
                className="flex flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div>
                  <p className="text-sm font-medium">
                    {donation.isAnonymous ? "Anonymous" : donation.donorName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {donation.paymentStatus} · {donation.paymentProvider}
                  </p>
                </div>
                <p className="text-sm font-semibold">
                  {formatDonationAmount(donation.amount, donation.currency)}
                </p>
              </div>
            ))}
          </div>
        }
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the campaign. Donation records will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
