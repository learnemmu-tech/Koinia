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
  return insertCampaign(input);
}

export async function updateDonationCampaign(
  campaignId: string,
  input: UpdateDonationCampaignInput
): Promise<void> {
  await saveCampaign(campaignId, input);
}

export async function setDonationCampaignStatus(
  campaignId: string,
  status: DonationCampaignStatus
): Promise<void> {
  await saveCampaign(campaignId, { status });
}

export async function deleteDonationCampaign(campaignId: string): Promise<void> {
  await removeCampaign(campaignId);
}
