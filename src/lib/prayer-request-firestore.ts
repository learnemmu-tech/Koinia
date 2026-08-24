import type {
  CreatePrayerRequestInput,
  FirebasePrayerRequest,
  PrayerRequestCategory,
  PrayerRequestStatus,
} from "@/types/firebase-prayer-request";

import { resolveDocumentChurchId } from "./church-scope";
import { toMillis } from "./firebase-utils";

export const PRAYER_REQUESTS_COLLECTION = "prayerRequests";
export const PRAYER_INTERCESSIONS_COLLECTION = "prayerIntercessions";

const VALID_CATEGORIES: PrayerRequestCategory[] = [
  "general",
  "health",
  "family",
  "finances",
  "salvation",
  "guidance",
  "thanksgiving",
  "other",
];

function normalizeCategory(value: unknown): PrayerRequestCategory {
  const category = String(value ?? "general").trim().toLowerCase();
  if (VALID_CATEGORIES.includes(category as PrayerRequestCategory)) {
    return category as PrayerRequestCategory;
  }
  return "general";
}

const VALID_STATUSES: PrayerRequestStatus[] = [
  "pending",
  "approved",
  "rejected",
];

function normalizeStatus(value: unknown): PrayerRequestStatus {
  const status = String(value ?? "pending").trim().toLowerCase();
  if (VALID_STATUSES.includes(status as PrayerRequestStatus)) {
    return status as PrayerRequestStatus;
  }
  return "pending";
}

export function normalizePrayerRequestFromFirestore(
  id: string,
  data: Record<string, unknown>
): FirebasePrayerRequest {
  const email = String(data.email ?? "").trim();

  const userId = String(data.userId ?? "").trim();

  return {
    id,
    churchId: resolveDocumentChurchId(data),
    userId: userId || undefined,
    name: String(data.name ?? "").trim() || "Anonymous",
    email: email || undefined,
    title: String(data.title ?? "").trim(),
    request: String(data.request ?? "").trim(),
    category: normalizeCategory(data.category),
    isAnonymous: Boolean(data.isAnonymous),
    shareWithCommunity: data.shareWithCommunity !== false,
    isAnswered: Boolean(data.isAnswered),
    answeredAt:
      data.answeredAt != null ? toMillis(data.answeredAt) : undefined,
    status: normalizeStatus(data.status),
    prayerCount: Number(data.prayerCount ?? 0) || 0,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt ?? data.createdAt),
  };
}

export function getPrayerRequestDisplayName(
  request: Pick<FirebasePrayerRequest, "name" | "isAnonymous">
): string {
  if (request.isAnonymous) return "Anonymous";
  return request.name.trim() || "Anonymous";
}

export function toPrayerRequestPreview(
  request: string,
  maxLength = 120
): string {
  const normalized = request.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}…`;
}

/** Fixed locale so SSR and client hydration produce identical date strings. */
const PRAYER_DATE_LOCALE = "en-US";

export function formatPrayerDate(timestamp: number): string {
  return new Intl.DateTimeFormat(PRAYER_DATE_LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}

export function buildPrayerRequestCreatePayload(
  input: CreatePrayerRequestInput
): Record<string, unknown> {
  const displayName = input.isAnonymous
    ? "Anonymous"
    : getPrayerRequestDisplayName({
        name: input.name,
        isAnonymous: false,
      });

  return {
    churchId: input.churchId.trim() || "default",
    userId: input.userId.trim(),
    name: displayName,
    email: input.email?.trim() || null,
    title: input.title,
    request: input.request,
    category: input.category,
    isAnonymous: input.isAnonymous,
    shareWithCommunity: input.shareWithCommunity,
    isAnswered: false,
    answeredAt: null,
    status: "pending",
    prayerCount: 0,
  };
}

export function buildPrayerIntercessionId(
  requestId: string,
  userId: string
): string {
  return `${requestId}_${userId}`;
}

/** Approved requests visible on the public community wall. */
export function isPublicPrayerRequest(
  request: Pick<FirebasePrayerRequest, "status" | "shareWithCommunity">
): boolean {
  return request.status === "approved" && request.shareWithCommunity !== false;
}
