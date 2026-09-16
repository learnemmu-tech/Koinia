import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { rateLimitSubscriptionRequest } from "@/lib/rate-limit";
import {
  createRazorpaySubscription,
  getRazorpayPublicKey,
  updateRazorpaySubscriptionPlan,
} from "@/lib/payments/razorpay-subscriptions";
import {
  getOrganizationSubscription,
  hasOpenRazorpaySubscription,
  claimSubscriptionCheckoutAttempt,
  markSubscriptionCheckoutCreated,
  markSubscriptionCheckoutFailed,
} from "@/lib/subscription/razorpay-subscription-server";
import {
  authErrorResponse,
  requireBillingAdmin,
} from "@/lib/subscription/subscription-api-auth";
export async function POST(request: Request) {
  let attemptId: string | undefined;
  try {
    const body = (await request.json().catch(() => ({}))) as {
      planId?: string;
      organizationId?: string;
      requestId?: string;
    };
    const planId = body.planId;
    if (planId !== "starter" && planId !== "professional") {
      return NextResponse.json({ error: "Unsupported subscription plan." }, { status: 400 });
    }

    const auth = await requireBillingAdmin(request, body.organizationId);
    const rateLimit = await rateLimitSubscriptionRequest(auth.appUserId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many subscription attempts. Please try again later." },
        { status: 429 }
      );
    }

    const existing = await getOrganizationSubscription(auth.organizationId);
    if (hasOpenRazorpaySubscription(existing)) {
      if (existing?.planId === planId) {
        return NextResponse.json(
          { error: "A subscription for this plan already exists." },
          { status: 409 }
        );
      }
      if (
        existing?.razorpaySubscriptionId &&
        (existing.planId === "starter" || existing.planId === "professional")
      ) {
        const updated = await updateRazorpaySubscriptionPlan({
          subscriptionId: existing.razorpaySubscriptionId,
          planId,
        });
        return NextResponse.json({
          mode: "scheduled_change",
          subscriptionId: updated.id,
          planId,
          message: "Your plan change is scheduled for the end of the current billing period.",
        });
      }
      return NextResponse.json(
        { error: "An existing subscription needs attention before starting another." },
        { status: 409 }
      );
    }

    const requestId = body.requestId?.trim() || randomUUID();
    const claim = await claimSubscriptionCheckoutAttempt({
      organizationId: auth.organizationId,
      requestId,
      planId,
    });
    attemptId = claim.attempt.id;
    if (claim.kind === "reuse" && claim.attempt.providerSubscriptionId) {
      return NextResponse.json({
        mode: "checkout",
        key: getRazorpayPublicKey(),
        subscriptionId: claim.attempt.providerSubscriptionId,
        planId,
      });
    }
    if (claim.kind === "conflict") {
      return NextResponse.json(
        { error: "A subscription checkout is already in progress for this organization." },
        { status: 409 }
      );
    }

    const subscription = await createRazorpaySubscription({
      organizationId: auth.organizationId,
      planId,
    });
    await markSubscriptionCheckoutCreated({
      attemptId,
      subscription,
    });

    return NextResponse.json({
      mode: "checkout",
      key: getRazorpayPublicKey(),
      subscriptionId: subscription.id,
      planId,
    });
  } catch (error) {
    if (attemptId) await markSubscriptionCheckoutFailed(attemptId);
    const authError = authErrorResponse(error);
    if (authError.status !== 403 || authError.error !== "Unable to authorize billing action.") {
      return NextResponse.json({ error: authError.error }, { status: authError.status });
    }
    console.error("[api/subscription/razorpay/create]", error instanceof Error ? error.message : "request failed");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to start subscription." },
      { status: 503 }
    );
  }
}
