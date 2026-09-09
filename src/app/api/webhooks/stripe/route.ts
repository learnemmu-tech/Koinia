import { NextResponse } from "next/server";

import { completeDonationPayment } from "@/lib/donation-server";
import { getPaymentProvider } from "@/lib/payments";

export async function POST(request: Request) {
  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET?.trim()) {
      console.error("[webhooks/stripe] STRIPE_WEBHOOK_SECRET is not configured");
      return NextResponse.json(
        { error: "Webhook not configured." },
        { status: 503 }
      );
    }

    const payload = await request.text();
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature." }, { status: 400 });
    }

    const provider = getPaymentProvider("stripe");
    const event = await provider.verifyWebhook(payload, signature);

    // Valid signature but event type we ignore — acknowledge without completing.
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
    const message =
      error instanceof Error ? error.message : "Stripe webhook failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
