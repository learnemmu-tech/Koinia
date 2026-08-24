import Stripe from "stripe";

import type { DonationCurrency } from "@/types/firebase-donation";

import type {
  CheckoutSessionResult,
  CreateCheckoutParams,
  PaymentProvider,
  VerifiedPaymentEvent,
} from "./types";

function getStripeSecretKey(): string | null {
  return process.env.STRIPE_SECRET_KEY?.trim() || null;
}

function getStripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;
}

function toStripeAmount(amount: number, currency: DonationCurrency): number {
  const zeroDecimalCurrencies = new Set(["jpy"]);
  if (zeroDecimalCurrencies.has(currency.toLowerCase())) {
    return Math.round(amount);
  }
  return Math.round(amount * 100);
}

export class StripePaymentProvider implements PaymentProvider {
  readonly id = "stripe" as const;

  isConfigured(): boolean {
    return Boolean(getStripeSecretKey());
  }

  private getClient(): Stripe {
    const secretKey = getStripeSecretKey();
    if (!secretKey) {
      throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
    }
    return new Stripe(secretKey);
  }

  async createCheckoutSession(
    params: CreateCheckoutParams
  ): Promise<CheckoutSessionResult> {
    const stripe = this.getClient();
    const displayName = params.isAnonymous ? "Anonymous Donor" : params.donorName;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: params.donorEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: params.currency.toLowerCase(),
            unit_amount: toStripeAmount(params.amount, params.currency),
            product_data: {
              name: params.campaignTitle,
              description: `Donation to ${params.campaignTitle}`,
            },
          },
        },
      ],
      success_url: `${params.successUrl}?donationId=${encodeURIComponent(params.donationId)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: params.cancelUrl,
      metadata: {
        donationId: params.donationId,
        campaignId: params.campaignId,
        donorName: displayName,
        isAnonymous: params.isAnonymous ? "true" : "false",
      },
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    return {
      provider: "stripe",
      sessionId: session.id,
      checkoutUrl: session.url,
      publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim(),
    };
  }

  async verifyWebhook(
    payload: string,
    signature: string | null
  ): Promise<VerifiedPaymentEvent | null> {
    const webhookSecret = getStripeWebhookSecret();
    if (!webhookSecret || !signature) return null;

    const stripe = this.getClient();
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const donationId = session.metadata?.donationId;
      const campaignId = session.metadata?.campaignId;
      if (!donationId || !campaignId) return null;

      return {
        provider: "stripe",
        transactionId: String(session.payment_intent ?? session.id),
        donationId,
        campaignId,
        amount: (session.amount_total ?? 0) / 100,
        currency: String(session.currency ?? "inr").toUpperCase() as DonationCurrency,
        status: "completed",
      };
    }

    if (
      event.type === "checkout.session.expired" ||
      event.type === "payment_intent.payment_failed"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      const donationId = session.metadata?.donationId;
      const campaignId = session.metadata?.campaignId;
      if (!donationId || !campaignId) return null;

      return {
        provider: "stripe",
        transactionId: String(session.payment_intent ?? session.id),
        donationId,
        campaignId,
        amount: (session.amount_total ?? 0) / 100,
        currency: String(session.currency ?? "inr").toUpperCase() as DonationCurrency,
        status: "failed",
      };
    }

    return null;
  }
}
