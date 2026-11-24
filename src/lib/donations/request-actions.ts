"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import {
  decideDonationRequest,
  listChurchDonationRequests,
  listDonationRequestReviewHistory,
  submitDonationRequest,
} from "@/lib/donations/request-service";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";

async function actorId() {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await getAppUserByClerkId(userId);
  return user?.id ?? null;
}

export async function submitDonationRequestAction(formData: FormData) {
  const userId = await actorId();
  if (!userId) return { ok: false as const, error: "Sign in to submit a request." };
  return submitDonationRequest({
    userId,
    title: String(formData.get("title") ?? ""),
    category: String(formData.get("category") ?? ""),
    reason: String(formData.get("reason") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    additionalInformation: String(formData.get("additional") ?? ""),
    acknowledged: formData.get("acknowledged") === "on",
    idempotencyKey: String(formData.get("idempotencyKey") ?? ""),
  });
}

export async function decideDonationRequestAction(formData: FormData) {
  const userId = await actorId();
  if (!userId) return { ok: false as const, error: "Sign in required." };
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "approved" && decision !== "rejected" && decision !== "under_review") {
    return { ok: false as const, error: "Invalid decision." };
  }
  return decideDonationRequest({
    actorId: userId,
    requestId: String(formData.get("requestId") ?? ""),
    decision,
    memberResponse: String(formData.get("memberResponse") ?? ""),
  });
}

export async function listAdminDonationRequestsAction() {
  const userId = await actorId();
  if (!userId) return [];
  const rows = await listChurchDonationRequests(userId);
  return rows.map((row) => ({
    ...row,
    amount: row.amount == null ? null : String(row.amount),
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function listDonationRequestReviewHistoryAction(requestId: string) {
  const userId = await actorId();
  if (!userId) return [];
  const rows = await listDonationRequestReviewHistory(userId, requestId);
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function decideDonationRequestFormAction(formData: FormData): Promise<void> {
  const result = await decideDonationRequestAction(formData);
  const requestId = String(formData.get("requestId") ?? "");
  if (!result.ok) {
    redirect(
      `/dashboard/content?tab=donations&section=requests&request=${requestId}&error=${encodeURIComponent(result.error)}`
    );
  }
  redirect(`/dashboard/content?tab=donations&section=requests&request=${requestId}&updated=1`);
}
