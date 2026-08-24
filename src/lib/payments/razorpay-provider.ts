import type { DonationCurrency } from "@/types/firebase-donation";

import type {
  CheckoutSessionResult,
  CreateCheckoutParams,
  PaymentProvider,
  VerifiedPaymentEvent,
} from "./types";

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

type RazorpayPayment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  notes?: Record<string, string>;
};

function getRazorpayKeyId(): string | null {
  return process.env.RAZORPAY_KEY_ID?.trim() || null;
}

function getRazorpayKeySecret(): string | null {
  return process.env.RAZORPAY_KEY_SECRET?.trim() || null;
}

function getRazorpayWebhookSecret(): string | null {
  return process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || null;
}

function toRazorpayAmount(amount: number): number {
  return Math.round(amount * 100);
}

function getAuthHeader(): string {
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();
  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

export class RazorpayPaymentProvider implements PaymentProvider {
  readonly id = "razorpay" as const;

  isConfigured(): boolean {
    return Boolean(getRazorpayKeyId() && getRazorpayKeySecret());
  }

  async createCheckoutSession(
    params: CreateCheckoutParams
  ): Promise<CheckoutSessionResult> {
    const displayName = params.isAnonymous ? "Anonymous Donor" : params.donorName;

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: toRazorpayAmount(params.amount),
        currency: params.currency,
        receipt: params.donationId,
        notes: {
          donationId: params.donationId,
          campaignId: params.campaignId,
          donorName: displayName,
          donorEmail: params.donorEmail,
          isAnonymous: params.isAnonymous ? "true" : "false",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Razorpay order creation failed: ${errorText}`);
    }

    const order = (await response.json()) as RazorpayOrder;
    const keyId = getRazorpayKeyId();
    if (!keyId) {
      throw new Error("Razorpay key id is missing.");
    }

    const checkoutUrl = `${params.successUrl.replace("/success", "/checkout/razorpay")}?donationId=${encodeURIComponent(params.donationId)}&orderId=${encodeURIComponent(order.id)}&amount=${params.amount}&currency=${params.currency}&campaignTitle=${encodeURIComponent(params.campaignTitle)}`;

    return {
      provider: "razorpay",
      sessionId: order.id,
      orderId: order.id,
      checkoutUrl,
      publicKey: keyId,
    };
  }

  async verifyWebhook(
    payload: string,
    signature: string | null
  ): Promise<VerifiedPaymentEvent | null> {
    const webhookSecret = getRazorpayWebhookSecret();
    if (!webhookSecret || !signature) return null;

    const crypto = await import("crypto");
    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("hex");

    if (expected !== signature) {
      throw new Error("Invalid Razorpay webhook signature.");
    }

    const body = JSON.parse(payload) as {
      event: string;
      payload?: {
        payment?: { entity?: RazorpayPayment };
      };
    };

    const payment = body.payload?.payment?.entity;
    if (!payment) return null;

    const donationId = payment.notes?.donationId;
    const campaignId = payment.notes?.campaignId;
    if (!donationId || !campaignId) return null;

    const status =
      body.event === "payment.captured" ? "completed"
      : body.event === "payment.failed" ? "failed"
      : "cancelled";

    return {
      provider: "razorpay",
      transactionId: payment.id,
      donationId,
      campaignId,
      amount: payment.amount / 100,
      currency: payment.currency.toUpperCase() as DonationCurrency,
      status,
    };
  }
}
