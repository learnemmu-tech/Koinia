"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidateTag } from "next/cache";
import { after } from "next/server";

import { userCanReviewChurchMemberships } from "@/lib/postgres/session";

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

async function assertChurchDonationAdmin(
  churchId: string | null | undefined,
  contentScope?: string | null
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Sign in to manage donations.");
  if (contentScope === "platform_public") {
    const { requirePlatformSuperAdmin } = await import(
      "@/lib/auth/require-platform-super-admin"
    );
    await requirePlatformSuperAdmin();
    return;
  }
  if (!churchId?.trim()) throw new Error("You do not have permission to manage donations.");
  const allowed = await userCanReviewChurchMemberships(userId, undefined, churchId);
  if (!allowed) {
    throw new Error("You do not have permission to manage this church's donations.");
  }
}

export async function createDonationCampaign(
  input: CreateDonationCampaignInput
): Promise<string> {
  const organizationId = input.organizationId?.trim();
  const churchId = input.churchId?.trim();
  if (input.contentScope !== "platform_public") {
    await assertChurchDonationAdmin(churchId);
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
    scheduleDonationAnnouncement(id);
  }
  return id;
}

export async function updateDonationCampaign(
  campaignId: string,
  input: UpdateDonationCampaignInput
): Promise<void> {
  const existing = await getDonationCampaignById(campaignId);
  await assertChurchDonationAdmin(existing?.churchId, existing?.contentScope);
  await saveCampaign(campaignId, input);
  await refreshDonationSurfaces(existing?.churchId, campaignId);
  const nextStatus = input.status ?? existing?.status;
  if (nextStatus === "active" && existing?.status !== "active") {
    scheduleDonationAnnouncement(campaignId);
  }
}

export async function setDonationCampaignStatus(
  campaignId: string,
  status: DonationCampaignStatus
): Promise<void> {
  const existing = await getDonationCampaignById(campaignId);
  await assertChurchDonationAdmin(existing?.churchId, existing?.contentScope);
  await saveCampaign(campaignId, { status });
  await refreshDonationSurfaces(existing?.churchId, campaignId);
  if (status === "active" && existing?.status !== "active") {
    scheduleDonationAnnouncement(campaignId);
  }
}

function scheduleDonationAnnouncement(campaignId: string) {
  after(() => {
    void import("@/lib/email/triggers")
      .then(({ triggerContentAnnouncementEmails }) =>
        triggerContentAnnouncementEmails("donation_campaign", campaignId)
      )
      .catch((error: unknown) => {
        console.error("[notifications] donation campaign email failed", {
          campaignId,
          error: error instanceof Error ? error.message : "unknown",
        });
      });
  });
}

export async function deleteDonationCampaign(campaignId: string): Promise<void> {
  const existing = await getDonationCampaignById(campaignId);
  await assertChurchDonationAdmin(existing?.churchId, existing?.contentScope);
  await removeCampaign(campaignId);
  await refreshDonationSurfaces(existing?.churchId, campaignId);
}
