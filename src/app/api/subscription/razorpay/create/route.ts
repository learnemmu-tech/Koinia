import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { clerkClient } from "@clerk/nextjs/server";

import { rateLimitSubscriptionRequest } from "@/lib/rate-limit";
import {
  cancelRazorpaySubscription,
  createRazorpaySubscription,
  ensureRazorpayCustomer,
  getRazorpayPublicKey,
} from "@/lib/payments/razorpay-subscriptions";
import { deferredSubscriptionStart } from "@/lib/subscription/billing-eligibility";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import {
  getOrganizationSubscription,
  hasOpenRazorpaySubscription,
  claimSubscriptionCheckoutAttempt,
  markSubscriptionCheckoutCreated,
  markSubscriptionCheckoutFailed,
  persistRazorpayCustomerId,
} from "@/lib/subscription/razorpay-subscription-server";
import {
  authErrorResponse,
  requireBillingAdmin,
} from "@/lib/subscription/subscription-api-auth";

async function resolvePayerPrefill(clerkId: string) {
  const appUser = await getAppUserByClerkId(clerkId);
  const name = [appUser?.firstName, appUser?.lastName]
    .filter((value) => Boolean(value?.trim()))
    .join(" ")
    .trim();
  const email = appUser?.email.trim() || undefined;
  let contact: string | undefined;
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);
    const phone =
      clerkUser.primaryPhoneNumber?.phoneNumber ??
      clerkUser.phoneNumbers[0]?.phoneNumber;
    contact = phone?.replace(/\s+/g, "") || undefined;
  } catch {
    contact = undefined;
  }
  return {
    name: name || undefined,
    email,
    contact,
  };
}

export async function POST(request: Request) {
  let attemptId: string | undefined;
  let createdSubscriptionId: string | undefined;
  let checkoutPersisted = false;
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
    let startAt: number | undefined;
    if (hasOpenRazorpaySubscription(existing)) {
      if (existing?.planId === planId) {
        return NextResponse.json(
          { error: "A subscription for this plan already exists." },
          { status: 409 }
        );
      }
      const deferred = deferredSubscriptionStart(existing?.currentPeriodEnd ?? null);
      if (deferred === "too_soon") {
        return NextResponse.json(
          {
            error:
              "This card subscription cannot change plans immediately. Try again after the current period ends.",
          },
          { status: 409 }
        );
      }
      if (!deferred || !existing?.razorpaySubscriptionId) {
        return NextResponse.json(
          { error: "An existing subscription needs attention before starting another." },
          { status: 409 }
        );
      }
      startAt = deferred;
    }

    const requestId = body.requestId?.trim() || randomUUID();
    const claim = await claimSubscriptionCheckoutAttempt({
      organizationId: auth.organizationId,
      requestId,
      planId,
    });
    attemptId = claim.attempt.id;
    const prefill = await resolvePayerPrefill(auth.clerkId);
    const existingCustomerId = existing?.razorpayCustomerId ?? null;
    let customerId: string | null = existingCustomerId;
    try {
      customerId = await ensureRazorpayCustomer({
        existingCustomerId,
        name: prefill.name,
        email: prefill.email,
        contact: prefill.contact,
      });
      if (customerId) {
        await persistRazorpayCustomerId({
          organizationId: auth.organizationId,
          customerId,
        });
      }
    } catch (error) {
      console.error("[api/subscription/razorpay/create] customer", {
        organizationId: auth.organizationId,
        error: error instanceof Error ? error.message : "unknown",
      });
    }

    if (claim.kind === "scheduled") {
      return NextResponse.json({
        mode: "scheduled_change",
        subscriptionId: claim.attempt.providerSubscriptionId,
        planId,
        message:
          "Your plan change is already scheduled for the end of the current billing period. Starter access continues until then.",
      });
    }
    if (claim.kind === "reuse" && claim.attempt.providerSubscriptionId) {
      return NextResponse.json({
        mode: "checkout",
        key: getRazorpayPublicKey(),
        subscriptionId: claim.attempt.providerSubscriptionId,
        planId,
        prefill,
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
      customerId,
      notifyEmail: prefill.email,
      notifyPhone: prefill.contact,
      startAt,
    });
    createdSubscriptionId = subscription.id;
    await markSubscriptionCheckoutCreated({
      attemptId,
      subscription,
    });
    checkoutPersisted = true;

    return NextResponse.json({
      mode: "checkout",
      key: getRazorpayPublicKey(),
      subscriptionId: subscription.id,
      planId,
      prefill,
    });
  } catch (error) {
    if (createdSubscriptionId && !checkoutPersisted) {
      try {
        await cancelRazorpaySubscription(createdSubscriptionId, { atCycleEnd: false });
      } catch (cancelError) {
        console.error(
          "[api/subscription/razorpay/create] rollback cancel failed",
          cancelError instanceof Error ? cancelError.message : "unknown"
        );
      }
    }
    if (attemptId && !checkoutPersisted) await markSubscriptionCheckoutFailed(attemptId);
    const authError = authErrorResponse(error);
    if (authError.status !== 403 || authError.error !== "Unable to authorize billing action.") {
      return NextResponse.json({ error: authError.error }, { status: authError.status });
    }
    console.error("[api/subscription/razorpay/create]", error instanceof Error ? error.message : "request failed");
    const raw = error instanceof Error ? error.message : "";
    const customerMessage = /domestic card/i.test(raw)
      ? "This card subscription cannot change plans in place. Choose the new plan again to schedule it for the end of the current period."
      : raw || "Unable to start subscription.";
    return NextResponse.json(
      { error: customerMessage },
      { status: 503 }
    );
  }
}
