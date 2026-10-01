import { NextResponse } from "next/server";

import { createHmac, timingSafeEqual } from "crypto";

import { completeDonationPayment } from "@/lib/donation-server";
import { getDonationById } from "@/lib/postgres/features";
import { rateLimitDonationCheckout } from "@/lib/rate-limit";

function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret =
    process.env.RAZORPAY_SECRET_KEY?.trim() ||
    process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret) return false;

  const expected = createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  try {
    const expectedBuf = Buffer.from(expected, "utf8");
    const signatureBuf = Buffer.from(signature, "utf8");
    if (expectedBuf.length !== signatureBuf.length) return false;
    return timingSafeEqual(expectedBuf, signatureBuf);
  } catch {
    return false;
  }
}

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function POST(request: Request) {
  try {
    const rate = await rateLimitDonationCheckout(clientIp(request));
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many donation attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = (await request.json()) as {
      donationId?: string;
      campaignId?: string;
      orderId?: string;
      paymentId?: string;
      signature?: string;
    };

    if (
      !body.donationId ||
      !body.campaignId ||
      !body.orderId ||
      !body.paymentId ||
      !body.signature
    ) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (!verifyRazorpaySignature(body.orderId, body.paymentId, body.signature)) {
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
    }

    const donation = await getDonationById(body.donationId);
    if (!donation) {
      return NextResponse.json({ error: "Donation not found." }, { status: 404 });
    }

    if (donation.campaignId !== body.campaignId) {
      return NextResponse.json({ error: "Donation mismatch." }, { status: 400 });
    }

    // Checkout stores the Razorpay order id on the pending donation.
    if (donation.transactionId !== body.orderId) {
      return NextResponse.json(
        { error: "Payment is not bound to this donation." },
        { status: 400 }
      );
    }

    if (donation.paymentProvider !== "razorpay") {
      return NextResponse.json({ error: "Invalid payment provider." }, { status: 400 });
    }

    if (donation.paymentStatus === "completed") {
      return NextResponse.json({ success: true });
    }

    if (donation.paymentStatus !== "pending") {
      return NextResponse.json({ error: "Donation is not pending." }, { status: 400 });
    }

    await completeDonationPayment({
      donationId: donation.id,
      campaignId: donation.campaignId,
      transactionId: body.paymentId,
      amount: donation.amount,
      currency: donation.currency,
      paymentProvider: "razorpay",
      status: "completed",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[donations/verify-razorpay]", error);
    return NextResponse.json(
      { error: "Unable to verify payment." },
      { status: 500 }
    );
  }
}
