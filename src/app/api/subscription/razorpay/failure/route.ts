import { NextResponse } from "next/server";

import { failSubscriptionCheckoutAttempt } from "@/lib/subscription/razorpay-subscription-server";
import {
  authErrorResponse,
  requireBillingAdmin,
} from "@/lib/subscription/subscription-api-auth";

type PaymentFailureDiagnostics = {
  code?: string;
  source?: string;
  step?: string;
  reason?: string;
  description?: string;
  field?: string;
  subscriptionId?: string;
  paymentId?: string;
  metadata?: Record<string, string>;
};

function sanitizeDiagnostics(
  input: PaymentFailureDiagnostics | undefined
): PaymentFailureDiagnostics {
  const metadata = input?.metadata;
  const safeMetadata =
    metadata && typeof metadata === "object"
      ? Object.fromEntries(
          Object.entries(metadata)
            .filter(([, value]) => typeof value === "string" || typeof value === "number")
            .map(([key, value]) => [key, String(value)])
            .filter(
              ([key]) =>
                !/card|cvv|pan|token|secret|authorization|cookie|password/i.test(key)
            )
            .slice(0, 20)
        )
      : undefined;
  return {
    code: input?.code,
    source: input?.source,
    step: input?.step,
    reason: input?.reason,
    description: input?.description,
    field: input?.field,
    subscriptionId: input?.subscriptionId,
    paymentId: input?.paymentId,
    metadata: safeMetadata,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      organizationId?: string;
      subscriptionId?: string;
      diagnostics?: PaymentFailureDiagnostics;
    };
    if (!body.subscriptionId?.trim()) {
      return NextResponse.json(
        { error: "Missing subscription id." },
        { status: 400 }
      );
    }

    const auth = await requireBillingAdmin(request, body.organizationId);
    const diagnostics = sanitizeDiagnostics({
      ...body.diagnostics,
      subscriptionId: body.subscriptionId.trim(),
    });
    console.error("[api/subscription/razorpay/failure]", {
      organizationId: auth.organizationId,
      ...diagnostics,
    });
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