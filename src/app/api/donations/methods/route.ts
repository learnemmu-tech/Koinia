import { NextResponse } from "next/server";

import { publicCampaignMethods } from "@/lib/donations/church-receiving";
import { rateLimitDonationCheckout } from "@/lib/rate-limit";

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function GET(request: Request) {
  const rate = await rateLimitDonationCheckout(clientIp(request));
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }
  const campaignId = new URL(request.url).searchParams.get("campaignId")?.trim();
  if (!campaignId) {
    return NextResponse.json({ error: "Campaign is required." }, { status: 400 });
  }
  const methods = await publicCampaignMethods(campaignId);
  return NextResponse.json({
    methods,
    recipient: "church",
    currency: "INR",
    disclosure:
      "You are paying this church directly. Koinia does not receive or settle these funds. A payment reference is not proof of payment until the church verifies it.",
  });
}
