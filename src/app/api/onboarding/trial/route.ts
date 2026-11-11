import { NextResponse } from "next/server";

import { activateStoredOnboardingTrial } from "@/lib/subscription/activate-onboarding-trial";
import {
  authErrorResponse,
  requireBillingAdmin,
} from "@/lib/subscription/subscription-api-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      organizationId?: string;
    };
    const admin = await requireBillingAdmin(request, body.organizationId);
    const result = await activateStoredOnboardingTrial(admin.organizationId);
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
    const status = message.includes("Select a subscription plan") ? 400 : 500;
    return NextResponse.json(
      { error: message || "Failed to activate the free trial" },
      { status }
    );
  }
}
