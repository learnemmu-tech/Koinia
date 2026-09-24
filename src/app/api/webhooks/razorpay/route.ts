import { NextResponse } from "next/server";
import { createHash } from "crypto";

import { completeDonationPayment } from "@/lib/donation-server";
import {
  parseRazorpaySubscriptionEvent,
  verifyRazorpayWebhookSignature,
} from "@/lib/payments/razorpay-subscriptions";
import { getPaymentProvider } from "@/lib/payments";
import {
  applyRazorpaySubscriptionEvent,
  claimRazorpayWebhookEvent,
  failSubscriptionCheckoutByProviderId,
  markRazorpayWebhookEventProcessed,
} from "@/lib/subscription/razorpay-subscription-server";

export async function POST(request: Request) {
  try {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET?.trim()) {
      console.error(
        "[webhooks/razorpay] RAZORPAY_WEBHOOK_SECRET is not configured"
      );
      return NextResponse.json(
        { error: "Webhook not configured." },
        { status: 503 }
      );
    }

    const payload = await request.text();
    const signature = request.headers.get("x-razorpay-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature." }, { status: 400 });
    }

    if (!verifyRazorpayWebhookSignature(payload, signature)) {
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
    }

    const subscriptionEvent = parseRazorpaySubscriptionEvent(payload);
    if (subscriptionEvent.event === "payment.failed") {
      const payment = (
        subscriptionEvent as typeof subscriptionEvent & {
          payload?: {
            payment?: {
              entity?: {
                id?: string;
                subscription_id?: string;
                error_code?: string;
                error_description?: string;
                error_source?: string;
                error_step?: string;
                error_reason?: string;
              };
            };
          };
        }
      ).payload?.payment?.entity;
      const paymentSubscriptionId = payment?.subscription_id;
      if (paymentSubscriptionId) {
        console.error("[webhooks/razorpay] payment.failed", {
          event: subscriptionEvent.event,
          subscriptionId: paymentSubscriptionId,
          paymentId: payment?.id,
          code: payment?.error_code,
          source: payment?.error_source,
          step: payment?.error_step,
          reason: payment?.error_reason,
          description: payment?.error_description,
        });
        const eventId =
          subscriptionEvent.id ?? createHash("sha256").update(payload).digest("hex");
        const claimed = await claimRazorpayWebhookEvent({
          eventId,
          eventType: subscriptionEvent.event,
          subscriptionId: paymentSubscriptionId,
        });
        if (!claimed) return NextResponse.json({ received: true });
        await failSubscriptionCheckoutByProviderId(paymentSubscriptionId);
        await markRazorpayWebhookEventProcessed(eventId);
        return NextResponse.json({ received: true });
      }
    }
    if (subscriptionEvent.event.startsWith("subscription.")) {
      const subscription = subscriptionEvent.payload?.subscription?.entity;
      if (!subscription) {
        return NextResponse.json({ error: "Invalid subscription webhook." }, { status: 400 });
      }

      const eventId =
        subscriptionEvent.id ?? createHash("sha256").update(payload).digest("hex");
      const claimed = await claimRazorpayWebhookEvent({
        eventId,
        eventType: subscriptionEvent.event,
        subscriptionId: subscription.id,
      });
      if (!claimed) return NextResponse.json({ received: true });

      await applyRazorpaySubscriptionEvent(subscription, subscriptionEvent.event);
      await markRazorpayWebhookEventProcessed(eventId);
      return NextResponse.json({ received: true });
    }

    const provider = getPaymentProvider("razorpay");
    const event = await provider.verifyWebhook(payload, signature);

    if (!event) {
      return NextResponse.json({ received: true });
    }

    await completeDonationPayment({
      donationId: event.donationId,
      campaignId: event.campaignId,
      transactionId: event.transactionId,
      amount: event.amount,
      currency: event.currency,
      paymentProvider: event.provider,
      status: event.status,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[webhooks/razorpay]", error);
    return NextResponse.json(
      { error: "Webhook verification failed." },
      { status: 400 }
    );
  }
}
