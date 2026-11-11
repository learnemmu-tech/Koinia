import { NextResponse } from "next/server";

import {
  getBillingProfile,
  missingBillingFields,
  saveBillingProfile,
} from "@/lib/subscription/billing-profile";
import {
  authErrorResponse,
  requireBillingAdmin,
} from "@/lib/subscription/subscription-api-auth";

export async function GET(request: Request) {
  try {
    const organizationId = new URL(request.url).searchParams.get("organizationId") ?? undefined;
    const auth = await requireBillingAdmin(request, organizationId);
    const profile = await getBillingProfile(auth.organizationId);
    return NextResponse.json({
      profile,
      missing: missingBillingFields(profile),
      documentType: "payment_receipt",
      compliance:
        "FaithConnectHub does not have seller tax registration configured. Downloads are payment receipts, not tax invoices.",
    });
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError.error !== "Unable to authorize billing action.") {
      return NextResponse.json({ error: authError.error }, { status: authError.status });
    }
    return NextResponse.json({ error: "Unable to load billing details." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      organizationId?: string;
      legalName?: string;
      contactName?: string;
      email?: string;
      address?: string;
      country?: string;
      taxId?: string;
    };
    const auth = await requireBillingAdmin(request, body.organizationId);
    const profile = await saveBillingProfile(auth.organizationId, {
      legalName: body.legalName ?? "",
      contactName: body.contactName ?? "",
      email: body.email ?? "",
      address: body.address ?? "",
      country: body.country ?? "",
      taxId: body.taxId ?? "",
    });
    return NextResponse.json({ profile, missing: missingBillingFields(profile) });
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError.error !== "Unable to authorize billing action.") {
      return NextResponse.json({ error: authError.error }, { status: authError.status });
    }
    return NextResponse.json({ error: "Unable to save billing details." }, { status: 500 });
  }
}
