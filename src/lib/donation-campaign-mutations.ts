"use server";

import {
  createDonationCampaign as insertCampaign,
  deleteDonationCampaign as removeCampaign,
  updateDonationCampaign as saveCampaign,
} from "@/lib/postgres/features";
import type {
  CreateDonationCampaignInput,
  DonationCampaignStatus,
  UpdateDonationCampaignInput,
} from "@/types/firebase-donation";

export async function createDonationCampaign(
  input: CreateDonationCampaignInput
): Promise<string> {
  const organizationId = input.organizationId?.trim();
  const churchId = input.churchId?.trim();
  if (input.contentScope !== "platform_public") {
    if (organizationId) {
      const { assertFeatureAllowed } = await import(
        "@/lib/subscription/subscription-server"
      );
      await assertFeatureAllowed(organizationId, "canCreateDonations");
    } else if (churchId) {
      const { assertChurchFeatureAllowed } = await import(
        "@/lib/subscription/subscription-server"
      );
      await assertChurchFeatureAllowed(churchId, "canCreateDonations");
    } else {
      const { SubscriptionLimitError } = await import(
        "@/lib/subscription/subscription-server"
      );
      const { TRIAL_EXPIRED_MESSAGE } = await import("@/lib/subscription/trial");
      throw new SubscriptionLimitError(TRIAL_EXPIRED_MESSAGE);
    }
  }
  const id = await insertCampaign(input);
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
  const { getDonationCampaignById } = await import("@/lib/postgres/features");
  const existing = await getDonationCampaignById(campaignId);
  await saveCampaign(campaignId, input);
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
  const { getDonationCampaignById } = await import("@/lib/postgres/features");
  const existing = await getDonationCampaignById(campaignId);
  await saveCampaign(campaignId, { status });
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
  await removeCampaign(campaignId);
}
