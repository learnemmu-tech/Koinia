import { NextResponse } from "next/server";

import { donationCheckoutApiSchema } from "@/lib/donation-form-validation";
import {
  completeDonationPayment,
  createPendingDonation,
} from "@/lib/donation-server";
import { getDonationCampaignById } from "@/lib/firebase-donation-queries";
import { getConfiguredPaymentProvider } from "@/lib/payments";

function getBaseUrl(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") ?? "http";
  if (host) return `${protocol}://${host}`;
  return "http://localhost:3000";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = donationCheckoutApiSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const campaign = await getDonationCampaignById(parsed.data.campaignId);
    if (!campaign || campaign.status !== "active") {
      return NextResponse.json(
        { error: "This campaign is not accepting donations." },
        { status: 404 }
      );
    }

    const provider = getConfiguredPaymentProvider();
    const baseUrl = getBaseUrl(request);

    const donationId = await createPendingDonation({
      campaignId: campaign.id,
      donorName: parsed.data.donorName,
      donorEmail: parsed.data.donorEmail,
      amount: parsed.data.amount,
      currency: campaign.currency,
      isAnonymous: parsed.data.isAnonymous,
      paymentProvider: provider.id,
      idempotencyKey: parsed.data.idempotencyKey,
    });

    const checkout = await provider.createCheckoutSession({
      donationId,
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      amount: parsed.data.amount,
      currency: campaign.currency,
      donorName: parsed.data.donorName,
      donorEmail: parsed.data.donorEmail,
      isAnonymous: parsed.data.isAnonymous,
      successUrl: `${baseUrl}/donations/success`,
      cancelUrl: `${baseUrl}/donations/${encodeURIComponent(campaign.id)}?cancelled=1`,
    });

    return NextResponse.json({
      donationId,
      provider: checkout.provider,
      checkoutUrl: checkout.checkoutUrl,
      sessionId: checkout.sessionId,
      orderId: checkout.orderId,
      publicKey: checkout.publicKey,
      amount: parsed.data.amount,
      currency: campaign.currency,
      campaignTitle: campaign.title,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start checkout.";
    const status = message.includes("not configured") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      donationId?: string;
      campaignId?: string;
      transactionId?: string;
      amount?: number;
      currency?: string;
      paymentProvider?: "stripe" | "razorpay";
      status?: "completed" | "failed" | "cancelled";
    };

    if (
      !body.donationId ||
      !body.campaignId ||
      !body.transactionId ||
      !body.amount ||
      !body.currency ||
      !body.paymentProvider ||
      !body.status
    ) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    await completeDonationPayment({
      donationId: body.donationId,
      campaignId: body.campaignId,
      transactionId: body.transactionId,
      amount: body.amount,
      currency: body.currency.toUpperCase() as "INR" | "USD",
      paymentProvider: body.paymentProvider,
      status: body.status,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update donation.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
