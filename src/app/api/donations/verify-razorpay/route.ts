import { NextResponse } from "next/server";

import { createHmac } from "crypto";

import { completeDonationPayment } from "@/lib/donation-server";

function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret) return false;

  const expected = createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expected === signature;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      donationId?: string;
      campaignId?: string;
      orderId?: string;
      paymentId?: string;
      signature?: string;
      amount?: number;
      currency?: string;
    };

    if (
      !body.donationId ||
      !body.campaignId ||
      !body.orderId ||
      !body.paymentId ||
      !body.signature ||
      !body.amount ||
      !body.currency
    ) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (!verifyRazorpaySignature(body.orderId, body.paymentId, body.signature)) {
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
    }

    await completeDonationPayment({
      donationId: body.donationId,
      campaignId: body.campaignId,
      transactionId: body.paymentId,
      amount: body.amount,
      currency: body.currency.toUpperCase() as "INR" | "USD",
      paymentProvider: "razorpay",
      status: "completed",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to verify Razorpay payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
