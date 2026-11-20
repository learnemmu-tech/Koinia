"use server";

import { auth } from "@clerk/nextjs/server";

import {
  churchDonationReport,
  getChurchDonationSettings,
  previewChurchQr,
  recordOfflineDonation,
  reviewChurchDonation,
  saveChurchDonationDeclaration,
  saveChurchQrImage,
  saveChurchReceivingMethod,
  setCampaignReceivingMethods,
} from "@/lib/donations/church-receiving";
import type { ChurchReceivingMethod } from "@/lib/donations/receiving-validation";

async function clerkId() {
  const { userId } = await auth();
  if (!userId) throw new Error("Sign in to manage donations.");
  return userId;
}

export async function loadChurchDonationSettings(churchId: string) {
  return getChurchDonationSettings(await clerkId(), churchId);
}

export async function acceptDonationDeclaration(churchId: string) {
  await saveChurchDonationDeclaration({
    clerkId: await clerkId(),
    churchId,
    accepted: true,
  });
}

export async function saveReceivingMethod(input: {
  churchId: string;
  method: ChurchReceivingMethod;
  enabled: boolean;
  displayName: string;
  instructions?: string;
  upiId?: string;
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
}) {
  await saveChurchReceivingMethod({ ...input, clerkId: await clerkId() });
}

export async function uploadDonationQr(formData: FormData) {
  const churchId = String(formData.get("churchId") ?? "");
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Choose a QR image.");
  const bytes = Buffer.from(await file.arrayBuffer());
  return saveChurchQrImage({
    clerkId: await clerkId(),
    churchId,
    fileName: file.name,
    mimeType: file.type,
    bytes,
  });
}

export async function loadDonationQrPreview(churchId: string) {
  return previewChurchQr(await clerkId(), churchId);
}

export async function recordOfflineChurchDonation(input: {
  churchId: string;
  campaignId: string;
  amount: number;
  donatedOn: string;
  donorName?: string;
  donorPhone?: string;
  notes?: string;
  idempotencyKey?: string;
}) {
  return recordOfflineDonation({ ...input, clerkId: await clerkId() });
}

export async function decideChurchDonation(input: {
  churchId: string;
  donationId: string;
  decision: "verified" | "rejected";
  reason?: string;
}) {
  await reviewChurchDonation({ ...input, clerkId: await clerkId() });
}

export async function loadChurchDonationReport(input: {
  churchId: string;
  from?: string;
  to?: string;
}) {
  return churchDonationReport({ ...input, clerkId: await clerkId() });
}

export async function saveCampaignMethods(input: {
  churchId: string;
  campaignId: string;
  methods: ChurchReceivingMethod[];
}) {
  await setCampaignReceivingMethods({ ...input, clerkId: await clerkId() });
}
