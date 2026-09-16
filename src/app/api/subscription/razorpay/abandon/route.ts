import { NextResponse } from "next/server";

import {
  abandonSubscriptionCheckoutAttempt,
} from "@/lib/subscription/razorpay-subscription-server";
import {
  authErrorResponse,
  requireBillingAdmin,
} from "@/lib/subscription/subscription-api-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      organizationId?: string;
      subscriptionId?: string;
    };
    if (!body.subscriptionId?.trim()) {
      return NextResponse.json(
        { error: "Missing subscription id." },
        { status: 400 }
      );
    }

    const auth = await requireBillingAdmin(request, body.organizationId);
    const abandoned = await abandonSubscriptionCheckoutAttempt({
      organizationId: auth.organizationId,
      subscriptionId: body.subscriptionId.trim(),
    });

    return NextResponse.json({ abandoned });
  } catch (error) {
    const authError = authErrorResponse(error);
    if (
      authError.status !== 403 ||
      authError.error !== "Unable to authorize billing action."
    ) {
      return NextResponse.json(
        { error: authError.error },
        { status: authError.status }
      );
    }
    console.error(
      "[api/subscription/razorpay/abandon]",
      error instanceof Error ? error.message : "request failed"
    );
    return NextResponse.json(
      { error: "Unable to release subscription checkout." },
      { status: 500 }
    );
  }
}