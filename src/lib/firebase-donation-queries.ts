"use server";

import { desc, eq, and } from "drizzle-orm";

import { db } from "@/db";
import { donations } from "@/db/schema";
import {
  getDonationById as loadDonationById,
  getDonationCampaignById as loadCampaignById,
  listDonationCampaigns,
  listDonations,
} from "@/lib/postgres/features";
import { mapDonation } from "@/lib/postgres/mappers";
import type { ContentQueryInput } from "@/lib/content/content-scope";
import { PUBLIC_PLATFORM_CONTENT_QUERY } from "@/lib/content/content-scope";
import { contentScopeWhere, resolveContentQuery } from "@/lib/content/content-scope";
import type {
  FirebaseDonation,
  FirebaseDonationCampaign,
} from "@/types/firebase-donation";

export async function getDonationCampaigns(
  scope: ContentQueryInput
): Promise<FirebaseDonationCampaign[]> {
  return listDonationCampaigns(scope);
}

export async function getActiveDonationCampaigns(
  scope: ContentQueryInput,
  options?: { limit?: number }
): Promise<FirebaseDonationCampaign[]> {
  return listDonationCampaigns(scope, {
    publishedOnly: true,
    limit: options?.limit,
  });
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
    .where(
      contentScopeWhere(
        {
          contentScope: donations.contentScope,
          organizationId: donations.organizationId,
          churchId: donations.churchId,
        },
        resolveContentQuery(PUBLIC_PLATFORM_CONTENT_QUERY)
      )
    )
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
    .where(
      and(
        eq(donations.paymentStatus, "completed"),
        contentScopeWhere(
          {
            contentScope: donations.contentScope,
            organizationId: donations.organizationId,
            churchId: donations.churchId,
          },
          resolveContentQuery(PUBLIC_PLATFORM_CONTENT_QUERY)
        )
      )
    );
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
  scope: ContentQueryInput
): Promise<FirebaseDonation[]> {
  return listDonations(scope);
}

export async function getDonationsByEmail(
  email: string
): Promise<FirebaseDonation[]> {
  const { listDonationsByEmail } = await import("@/lib/postgres/features");
  return listDonationsByEmail(email);
}
