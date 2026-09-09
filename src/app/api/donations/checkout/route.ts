import { NextResponse } from "next/server";

import { donationCheckoutApiSchema } from "@/lib/donation-form-validation";
import {
  bindDonationCheckoutReference,
  createPendingDonation,
} from "@/lib/donation-server";
import { getDonationCampaignById } from "@/lib/firebase-donation-queries";
import { getConfiguredPaymentProvider } from "@/lib/payments";

function getBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured.");
  }
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
    const baseUrl = getBaseUrl();

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

    // Bind provider checkout/order id to the pending donation so client verify
    // cannot complete a different donation with a valid signature.
    const checkoutReference = checkout.orderId ?? checkout.sessionId;
    if (checkoutReference) {
      await bindDonationCheckoutReference(donationId, checkoutReference);
    }

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
