import { NextResponse } from "next/server";
import { z } from "zod";

import { submitChurchDonation } from "@/lib/donations/church-receiving";
import { rateLimitDonationCheckout } from "@/lib/rate-limit";

const schema = z
  .object({
    campaignId: z.string().uuid(),
    method: z.enum(["upi_qr", "upi_id", "bank_transfer"]),
    donorName: z.string().trim().max(120),
    donorEmail: z.string().trim().email().max(200),
    donorPhone: z.string().trim().max(20).optional(),
    amount: z.number().positive().max(1_000_000),
    isAnonymous: z.boolean(),
    paymentReference: z.string().trim().min(4).max(80),
    idempotencyKey: z.string().trim().min(8).max(128),
  })
  .strict();

const SAFE_ERRORS = new Set([
  "Enter the payment reference from your UPI or bank receipt.",
  "Enter a valid amount in INR.",
  "This campaign is not accepting donations.",
  "That receiving method is not available.",
  "This submission key was already used.",
  "Could not record the donation.",
]);

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function POST(request: Request) {
  // PUBLIC_MUTATION: donor reference submission is unauthenticated and rate limited.
  const rate = await rateLimitDonationCheckout(clientIp(request));
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many donation attempts." }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the donation details." }, { status: 400 });
  }
  if (!parsed.data.isAnonymous && parsed.data.donorName.trim().length < 2) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  try {
    const result = await submitChurchDonation(parsed.data);
    return NextResponse.json({
      donationId: result.id,
      status: "awaiting_verification",
      reused: result.reused,
      message:
        "Your reference was submitted. The church still needs to verify the payment. This is not a payment confirmation.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { error: SAFE_ERRORS.has(message) ? message : "Could not submit the donation." },
      { status: 400 }
    );
  }
}
