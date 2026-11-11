import { NextResponse } from "next/server";

import { listBillingReceipts } from "@/lib/subscription/billing-receipts";
import { syncOrganizationReceipts } from "@/lib/subscription/razorpay-subscription-server";
import {
  authErrorResponse,
  requireBillingAdmin,
} from "@/lib/subscription/subscription-api-auth";

export async function GET(request: Request) {
  try {
    const organizationId = new URL(request.url).searchParams.get("organizationId") ?? undefined;
    const auth = await requireBillingAdmin(request, organizationId ?? undefined);
    await syncOrganizationReceipts(auth.organizationId);
    const receipts = await listBillingReceipts(auth.organizationId);
    return NextResponse.json({
      receipts,
      notice:
        "These are payment receipts. FaithConnectHub does not have tax registration details configured, so these are not tax invoices.",
    });
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError.error !== "Unable to authorize billing action.") {
      return NextResponse.json({ error: authError.error }, { status: authError.status });
    }
    console.error(
      "[api/subscription/invoices]",
      error instanceof Error ? error.message : "request failed"
    );
    return NextResponse.json({ error: "Unable to load billing history." }, { status: 500 });
  }
}
