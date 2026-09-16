import { NextResponse } from "next/server";

import { cancelRazorpaySubscription } from "@/lib/payments/razorpay-subscriptions";
import {
  getOrganizationSubscription,
  applyRazorpaySubscriptionEvent,
} from "@/lib/subscription/razorpay-subscription-server";
import {
  authErrorResponse,
  requireBillingAdmin,
} from "@/lib/subscription/subscription-api-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      organizationId?: string;
    };
    const auth = await requireBillingAdmin(request, body.organizationId);
    const current = await getOrganizationSubscription(auth.organizationId);
    if (!current?.razorpaySubscriptionId) {
      return NextResponse.json({ error: "No Razorpay subscription found." }, { status: 404 });
    }

    const subscription = await cancelRazorpaySubscription(current.razorpaySubscriptionId);
    await applyRazorpaySubscriptionEvent(subscription, "subscription.cancelled", {
      cancelAtPeriodEnd: true,
    });

    return NextResponse.json({
      canceled: true,
      endsAt: subscription.current_end
        ? new Date(subscription.current_end * 1000).toISOString()
        : null,
    });
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError.status !== 403 || authError.error !== "Unable to authorize billing action.") {
      return NextResponse.json({ error: authError.error }, { status: authError.status });
    }
    console.error("[api/subscription/razorpay/cancel]", error instanceof Error ? error.message : "request failed");
    return NextResponse.json({ error: "Unable to cancel subscription." }, { status: 500 });
  }
}
