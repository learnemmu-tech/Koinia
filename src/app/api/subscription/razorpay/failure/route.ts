import { NextResponse } from "next/server";

import { failSubscriptionCheckoutAttempt } from "@/lib/subscription/razorpay-subscription-server";
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
    const failed = await failSubscriptionCheckoutAttempt({
      organizationId: auth.organizationId,
      subscriptionId: body.subscriptionId.trim(),
    });

    return NextResponse.json({
      failed,
      organizationId: auth.organizationId,
      subscriptionId: body.subscriptionId.trim(),
      state: failed ? "failed" : "not_transitioned",
    });
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
      "[api/subscription/razorpay/failure]",
      error instanceof Error ? error.message : "request failed"
    );
    return NextResponse.json(
      { error: "Unable to release failed subscription checkout." },
      { status: 500 }
    );
  }
}