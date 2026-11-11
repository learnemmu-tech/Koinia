import { NextResponse } from "next/server";

import { saveOnboardingPlan } from "@/lib/subscription/activate-onboarding-trial";
import {
  authErrorResponse,
  requireBillingAdmin,
} from "@/lib/subscription/subscription-api-auth";
import type { BillingInterval } from "@/types/subscription";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      planId?: string;
      billingInterval?: BillingInterval;
      organizationId?: string;
    };
    const admin = await requireBillingAdmin(request, body.organizationId);
    if (body.billingInterval !== "monthly" && body.billingInterval !== "yearly") {
      return NextResponse.json(
        { error: "Choose monthly or annual billing" },
        { status: 400 }
      );
    }
    const result = await saveOnboardingPlan({
      organizationId: admin.organizationId,
      planId: body.planId?.trim() ?? "",
      billingInterval: body.billingInterval,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    if (
      message === "Unauthorized" ||
      message === "Forbidden" ||
      message.includes("permission") ||
      message === "Organization not found"
    ) {
      const auth = authErrorResponse(error);
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const status = message.includes("not available") || message.includes("already") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
