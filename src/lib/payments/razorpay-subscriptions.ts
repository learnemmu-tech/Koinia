import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

import type { PlanId } from "@/types/subscription";

type RazorpaySubscriptionResponse = {
  id: string;
  plan_id: string;
  customer_id?: string | null;
  status: string;
  current_start?: number | string | null;
  current_end?: number | string | null;
  ended_at?: number | string | null;
  start_at?: number | string | null;
  end_at?: number | string | null;
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
  customerId,
  notifyEmail,
  notifyPhone,
  startAt,
}: {
  planId: Extract<PlanId, "starter" | "professional">;
  organizationId: string;
  customerId?: string | null;
  notifyEmail?: string;
  notifyPhone?: string;
  startAt?: number;
}): Promise<RazorpaySubscriptionResponse> {
  const linkedCustomerId = customerId?.trim() || undefined;
  const email = notifyEmail?.trim() || undefined;
  const phone = notifyPhone?.trim() || undefined;
  const canNotify = Boolean(linkedCustomerId || email || phone);
  return razorpayRequest<RazorpaySubscriptionResponse>("/subscriptions", "POST", {
    plan_id: getRazorpayPlanId(planId),
    total_count: getTotalCount(),
    quantity: 1,
    customer_notify: canNotify ? 1 : 0,
    ...(linkedCustomerId ? { customer_id: linkedCustomerId } : {}),
    ...(!linkedCustomerId && (email || phone)
      ? {
          notify_info: {
            ...(email ? { notify_email: email } : {}),
            ...(phone ? { notify_phone: phone } : {}),
          },
        }
      : {}),
    ...(startAt ? { start_at: startAt } : {}),
    notes: {
      organizationId,
      planId,
      ...(startAt ? { replacesAtPeriodEnd: "true" } : {}),
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
      customer_notify: 1,
    }
  );
}

export async function cancelRazorpaySubscription(
  subscriptionId: string,
  options?: { atCycleEnd?: boolean }
): Promise<RazorpaySubscriptionResponse> {
  const atCycleEnd = options?.atCycleEnd !== false;
  return razorpayRequest<RazorpaySubscriptionResponse>(
    `/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
    "POST",
    { cancel_at_cycle_end: atCycleEnd ? 1 : 0 }
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
  return safeEqualHex(expected, signature);
}

export function verifyRazorpayWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  return safeEqualHex(expected, signature);
}

function safeEqualHex(expected: string, signature: string): boolean {
  const expectedBuffer = Buffer.from(expected.toLowerCase(), "utf8");
  const signatureBuffer = Buffer.from(signature.trim().toLowerCase(), "utf8");
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

export function mapRazorpayPeriodDate(
  value?: number | string | null
): Date | undefined {
  if (value == null || value === "") return undefined;
  const seconds = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return undefined;
  return new Date(seconds * 1000);
}

export async function fetchRazorpayPayment(paymentId: string): Promise<{
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  status: string;
  methodSummary: string | null;
}> {
  const response = await fetch(
    `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: { Authorization: getAuthHeader() },
      cache: "no-store",
    }
  );
  if (!response.ok) {
    throw new Error("Unable to confirm the payment with Razorpay.");
  }
  const body = (await response.json()) as {
    id?: string;
    order_id?: string | null;
    amount?: number;
    currency?: string;
    status?: string;
  };
  if (!body.id || typeof body.amount !== "number" || !body.currency || !body.status) {
    throw new Error("Unable to confirm the payment with Razorpay.");
  }
  const method = (body as { method?: string; card?: { last4?: string }; vpa?: string }).method;
  const card = (body as { card?: { last4?: string } }).card;
  const vpa = (body as { vpa?: string }).vpa;
  let methodSummary: string | null = null;
  const network = (body as { card?: { network?: string; last4?: string } }).card?.network;
  if (method === "card" && card?.last4) {
    methodSummary = `${network ? `${network} ` : ""}card ending ${card.last4}`;
  }
  else if (method === "upi" && vpa) methodSummary = `UPI ${vpa}`;
  else if (method) methodSummary = method.toUpperCase();
  return {
    id: body.id,
    order_id: body.order_id ?? null,
    amount: body.amount,
    currency: body.currency,
    status: body.status,
    methodSummary,
  };
}

export type RazorpayPlanResponse = {
  id: string;
  period: string;
  interval: number;
};

export type RazorpayInvoiceResponse = {
  id: string;
  status: string;
  amount: number;
  amount_paid?: number;
  currency: string;
  payment_id?: string | null;
  subscription_id?: string | null;
  paid_at?: number | string | null;
  description?: string | null;
  customer_details?: { name?: string | null; email?: string | null };
  short_url?: string | null;
};

export async function fetchRazorpayPlan(planId: string): Promise<RazorpayPlanResponse> {
  return razorpayRequest<RazorpayPlanResponse>(
    `/plans/${encodeURIComponent(planId)}`,
    "GET"
  );
}

export async function fetchRazorpaySubscriptionInvoices(
  subscriptionId: string
): Promise<RazorpayInvoiceResponse[]> {
  const body = await razorpayRequest<{ items?: RazorpayInvoiceResponse[] }>(
    `/invoices?subscription_id=${encodeURIComponent(subscriptionId)}&count=100`,
    "GET"
  );
  return Array.isArray(body.items) ? body.items : [];
}

export type { RazorpayCustomerResponse, RazorpaySubscriptionResponse };
