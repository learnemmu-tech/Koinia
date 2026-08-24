import { NextResponse } from "next/server";

import { completeDonationPayment } from "@/lib/donation-server";
import { getPaymentProvider } from "@/lib/payments";

export async function POST(request: Request) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("stripe-signature");
    const provider = getPaymentProvider("stripe");
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
    const message =
      error instanceof Error ? error.message : "Stripe webhook failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
