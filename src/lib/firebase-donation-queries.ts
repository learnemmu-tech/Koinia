"use server";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { donations } from "@/db/schema";
import {
  getDonationById as loadDonationById,
  getDonationCampaignById as loadCampaignById,
  listDonationCampaigns,
  listDonations,
} from "@/lib/postgres/features";
import { mapDonation } from "@/lib/postgres/mappers";
import type { TenantScope } from "@/lib/organization/tenant-scope";
import type {
  FirebaseDonation,
  FirebaseDonationCampaign,
} from "@/types/firebase-donation";

export async function getDonationCampaigns(
  scope: TenantScope
): Promise<FirebaseDonationCampaign[]> {
  return listDonationCampaigns(scope);
}

export async function getActiveDonationCampaigns(
  scope: TenantScope
): Promise<FirebaseDonationCampaign[]> {
  return (await listDonationCampaigns(scope)).filter(
    (campaign) => campaign.status === "active"
  );
}

export async function getDonationCampaignById(
  campaignId: string
): Promise<FirebaseDonationCampaign | null> {
  return loadCampaignById(campaignId);
}

export async function getRecentDonations(
  limit = 10
): Promise<FirebaseDonation[]> {
  const rows = await db
    .select()
    .from(donations)
    .orderBy(desc(donations.createdAt))
    .limit(limit);
  return rows.map(mapDonation);
}

export async function getCompletedDonationStats(): Promise<{
  totalDonations: number;
  amountRaised: number;
}> {
  const rows = await db
    .select()
    .from(donations)
    .where(eq(donations.paymentStatus, "completed"));
  return {
    totalDonations: rows.length,
    amountRaised: rows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0),
  };
}

export async function getDonationById(
  donationId: string
): Promise<FirebaseDonation | null> {
  return loadDonationById(donationId);
}

export async function getChurchDonations(
  scope: TenantScope
): Promise<FirebaseDonation[]> {
  return listDonations(scope);
}

export async function getDonationsByEmail(
  email: string
): Promise<FirebaseDonation[]> {
  const { listDonationsByEmail } = await import("@/lib/postgres/features");
  return listDonationsByEmail(email);
}
