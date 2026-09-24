import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

import type { PlanId } from "@/types/subscription";

type RazorpaySubscriptionResponse = {
  id: string;
  plan_id: string;
  customer_id?: string | null;
  status: string;
  current_start?: number | null;
  current_end?: number | null;
  ended_at?: number | null;
  start_at?: number | null;
  end_at?: number | null;
  notes?: Record<string, string>;
  short_url?: string | null;
  change_scheduled_at?: number | null;
};

type RazorpayCustomerResponse = {
  id: string;
  name?: string | null;
  email?: string | null;
  contact?: string | null;
};

type RazorpaySubscriptionEvent = {
  id?: string;
  event: string;
  payload?: {
    subscription?: { entity?: RazorpaySubscriptionResponse };
  };
};

function getKeyId(): string | null {
  return process.env.RAZORPAY_KEY?.trim() || process.env.RAZORPAY_KEY_ID?.trim() || null;
}

function getSecretKey(): string | null {
  return (
    process.env.RAZORPAY_SECRET_KEY?.trim() ||
    process.env.RAZORPAY_KEY_SECRET?.trim() ||
    null
  );
}

export function getRazorpayPublicKey(): string {
  const key = getKeyId();
  if (!key) throw new Error("Razorpay is not configured.");
  return key;
}

function getAuthHeader(): string {
  const key = getKeyId();
  const secret = getSecretKey();
  if (!key || !secret) {
    throw new Error("Razorpay subscription credentials are not configured.");
  }
  return `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`;
}

export function getRazorpayPlanId(planId: Extract<PlanId, "starter" | "professional">): string {
  const envName =
    planId === "starter"
      ? "RAZORPAY_STARTER_PLAN_ID"
      : "RAZORPAY_PROFESSIONAL_PLAN_ID";
  const value = process.env[envName]?.trim();
  if (!value) throw new Error(`${envName} is not configured.`);
  return value;
}

export function getPlanIdFromRazorpayPlanId(value: string): Extract<
  PlanId,
  "starter" | "professional"
> | null {
  const normalized = value.trim();
  if (normalized && normalized === process.env.RAZORPAY_STARTER_PLAN_ID?.trim()) {
    return "starter";
  }
  if (
    normalized &&
    normalized === process.env.RAZORPAY_PROFESSIONAL_PLAN_ID?.trim()
  ) {
    return "professional";
  }
  return null;
}

function getTotalCount(): number {
  const value = Number(process.env.RAZORPAY_SUBSCRIPTION_TOTAL_COUNT ?? 1200);
  if (!Number.isInteger(value) || value < 1 || value > 1200) {
    throw new Error("RAZORPAY_SUBSCRIPTION_TOTAL_COUNT must be an integer from 1 to 1200.");
  }
  return value;
}

async function razorpayRequest<T>(
  path: string,
  method: "GET" | "POST" | "PATCH",
  body?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as
      | { error?: { description?: string } }
      | null;
    throw new Error(error?.error?.description ?? "Razorpay request failed.");
  }

  return (await response.json()) as T;
}

export async function fetchRazorpaySubscription(
  subscriptionId: string
): Promise<RazorpaySubscriptionResponse> {
  return razorpayRequest<RazorpaySubscriptionResponse>(
    `/subscriptions/${encodeURIComponent(subscriptionId)}`,
    "GET"
  );
}

export async function ensureRazorpayCustomer({
  existingCustomerId,
  name,
  email,
  contact,
}: {
  existingCustomerId?: string | null;
  name?: string;
  email?: string;
  contact?: string;
}): Promise<string | null> {
  const customerId = existingCustomerId?.trim();
  if (customerId) {
    try {
      const existing = await razorpayRequest<RazorpayCustomerResponse>(
        `/customers/${encodeURIComponent(customerId)}`,
        "GET"
      );
      if (existing.id) return existing.id;
    } catch {
      // Recreate below if the stored id is no longer valid.
    }
  }

  if (!email && !contact) return null;

  const created = await razorpayRequest<RazorpayCustomerResponse>(
    "/customers",
    "POST",
    {
      ...(name ? { name } : {}),
      ...(email ? { email } : {}),
      ...(contact ? { contact } : {}),
      fail_existing: 0,
    }
  );
  return created.id ?? null;
}

export async function createRazorpaySubscription({
  planId,
  organizationId,
}: {
  planId: Extract<PlanId, "starter" | "professional">;
  organizationId: string;
}): Promise<RazorpaySubscriptionResponse> {
  return razorpayRequest<RazorpaySubscriptionResponse>("/subscriptions", "POST", {
    plan_id: getRazorpayPlanId(planId),
    total_count: getTotalCount(),
    quantity: 1,
    customer_notify: true,
    notes: {
      organizationId,
      planId,
    },
  });
}

export async function updateRazorpaySubscriptionPlan({
  subscriptionId,
  planId,
}: {
  subscriptionId: string;
  planId: Extract<PlanId, "starter" | "professional">;
}): Promise<RazorpaySubscriptionResponse> {
  return razorpayRequest<RazorpaySubscriptionResponse>(
    `/subscriptions/${encodeURIComponent(subscriptionId)}`,
    "PATCH",
    {
      plan_id: getRazorpayPlanId(planId),
      schedule_change_at: "cycle_end",
      customer_notify: true,
    }
  );
}

export async function cancelRazorpaySubscription(
  subscriptionId: string
): Promise<RazorpaySubscriptionResponse> {
  return razorpayRequest<RazorpaySubscriptionResponse>(
    `/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
    "POST",
    { cancel_at_cycle_end: true }
  );
}

export function verifyRazorpaySubscriptionSignature({
  paymentId,
  subscriptionId,
  signature,
}: {
  paymentId: string;
  subscriptionId: string;
  signature: string;
}): boolean {
  const secret = getSecretKey();
  if (!secret) return false;
  const expected = createHmac("sha256", secret)
    .update(`${paymentId}|${subscriptionId}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");
  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}

export function verifyRazorpayWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");
  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}

export function parseRazorpaySubscriptionEvent(
  payload: string
): RazorpaySubscriptionEvent {
  return JSON.parse(payload) as RazorpaySubscriptionEvent;
}

export function mapRazorpayPeriodDate(value?: number | null): Date | undefined {
  return typeof value === "number" && value > 0 ? new Date(value * 1000) : undefined;
}

export type { RazorpayCustomerResponse, RazorpaySubscriptionResponse };
