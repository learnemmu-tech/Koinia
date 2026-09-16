import { NextResponse } from "next/server";

import { verifyRazorpaySubscriptionSignature } from "@/lib/payments/razorpay-subscriptions";
import { markRazorpayCheckoutAuthorized } from "@/lib/subscription/razorpay-subscription-server";
import {
  authErrorResponse,
  requireBillingAdmin,
} from "@/lib/subscription/subscription-api-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      organizationId?: string;
      subscriptionId?: string;
      paymentId?: string;
      signature?: string;
    };
    if (!body.subscriptionId || !body.paymentId || !body.signature) {
      return NextResponse.json({ error: "Missing subscription verification fields." }, { status: 400 });
    }

    const auth = await requireBillingAdmin(request, body.organizationId);
    if (
      !verifyRazorpaySubscriptionSignature({
        paymentId: body.paymentId,
        subscriptionId: body.subscriptionId,
        signature: body.signature,
      })
    ) {
      return NextResponse.json({ error: "Invalid subscription signature." }, { status: 400 });
    }

    await markRazorpayCheckoutAuthorized({
      organizationId: auth.organizationId,
      subscriptionId: body.subscriptionId,
    });

    return NextResponse.json({ verified: true });
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError.status !== 403 || authError.error !== "Unable to authorize billing action.") {
      return NextResponse.json({ error: authError.error }, { status: authError.status });
    }
    console.error("[api/subscription/razorpay/verify]", error instanceof Error ? error.message : "request failed");
    return NextResponse.json({ error: "Unable to verify subscription." }, { status: 500 });
  }
}
