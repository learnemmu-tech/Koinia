"use server";

import { revalidateTag } from "next/cache";

import {
  createDonationCampaign as insertCampaign,
  deleteDonationCampaign as removeCampaign,
  getDonationCampaignById,
  updateDonationCampaign as saveCampaign,
} from "@/lib/postgres/features";
import { revalidateChurchPublicSite } from "@/lib/templates/revalidate-church-website";
import type {
  CreateDonationCampaignInput,
  DonationCampaignStatus,
  UpdateDonationCampaignInput,
} from "@/types/firebase-donation";

async function refreshDonationSurfaces(
  churchId: string | null | undefined,
  campaignId?: string
) {
  revalidateTag("donations");
  if (campaignId) revalidateTag(`donation-campaign-${campaignId}`);
  await revalidateChurchPublicSite(churchId);
}

export async function createDonationCampaign(
  input: CreateDonationCampaignInput
): Promise<string> {
  const organizationId = input.organizationId?.trim();
  const churchId = input.churchId?.trim();
  if (input.contentScope !== "platform_public") {
    if (organizationId) {
      const { assertFeatureAllowed, assertUsageAllowed } = await import(
        "@/lib/subscription/subscription-server"
      );
      await assertFeatureAllowed(organizationId, "canCreateDonations");
      await assertUsageAllowed(organizationId, "donationCampaigns");
    } else if (churchId) {
      const { assertChurchFeatureAllowed, assertChurchUsageAllowed } = await import(
        "@/lib/subscription/subscription-server"
      );
      await assertChurchFeatureAllowed(churchId, "canCreateDonations");
      await assertChurchUsageAllowed(churchId, "donationCampaigns");
    } else {
      const { SubscriptionLimitError } = await import(
        "@/lib/subscription/subscription-server"
      );
      const { TRIAL_EXPIRED_MESSAGE } = await import("@/lib/subscription/trial");
      throw new SubscriptionLimitError(TRIAL_EXPIRED_MESSAGE);
    }
  }
  const id = await insertCampaign(input);
  await refreshDonationSurfaces(input.churchId, id);
  if (input.status === "active") {
    try {
      const { triggerContentAnnouncementEmails } = await import(
        "@/lib/email/triggers"
      );
      await triggerContentAnnouncementEmails("donation_campaign", id);
    } catch (error) {
      console.error("[notifications] donation campaign email failed", {
        campaignId: id,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }
  return id;
}

export async function updateDonationCampaign(
  campaignId: string,
  input: UpdateDonationCampaignInput
): Promise<void> {
  const existing = await getDonationCampaignById(campaignId);
  await saveCampaign(campaignId, input);
  await refreshDonationSurfaces(existing?.churchId, campaignId);
  const nextStatus = input.status ?? existing?.status;
  if (nextStatus === "active" && existing?.status !== "active") {
    try {
      const { triggerContentAnnouncementEmails } = await import(
        "@/lib/email/triggers"
      );
      await triggerContentAnnouncementEmails("donation_campaign", campaignId);
    } catch (error) {
      console.error("[notifications] donation campaign email failed", {
        campaignId,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }
}

export async function setDonationCampaignStatus(
  campaignId: string,
  status: DonationCampaignStatus
): Promise<void> {
  const existing = await getDonationCampaignById(campaignId);
  await saveCampaign(campaignId, { status });
  await refreshDonationSurfaces(existing?.churchId, campaignId);
  if (status === "active" && existing?.status !== "active") {
    try {
      const { triggerContentAnnouncementEmails } = await import(
        "@/lib/email/triggers"
      );
      await triggerContentAnnouncementEmails("donation_campaign", campaignId);
    } catch (error) {
      console.error("[notifications] donation campaign email failed", {
        campaignId,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }
}

export async function deleteDonationCampaign(campaignId: string): Promise<void> {
  const existing = await getDonationCampaignById(campaignId);
  await removeCampaign(campaignId);
  await refreshDonationSurfaces(existing?.churchId, campaignId);
}
