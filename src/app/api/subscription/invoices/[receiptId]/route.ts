import { NextResponse } from "next/server";

import {
  getBillingReceiptForOrganization,
  toBillingReceiptRecord,
} from "@/lib/subscription/billing-receipts";
import { getBillingProfile } from "@/lib/subscription/billing-profile";
import { renderReceiptPdf } from "@/lib/subscription/receipt-pdf";
import {
  authErrorResponse,
  requireBillingAdmin,
} from "@/lib/subscription/subscription-api-auth";

export async function GET(
  request: Request,
  context: { params: Promise<{ receiptId: string }> }
) {
  try {
    const { receiptId } = await context.params;
    const organizationId = new URL(request.url).searchParams.get("organizationId") ?? undefined;
    const auth = await requireBillingAdmin(request, organizationId ?? undefined);
    const row = await getBillingReceiptForOrganization(auth.organizationId, receiptId);
    if (!row) {
      return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
    }
    const profile = await getBillingProfile(auth.organizationId);
    const pdf = renderReceiptPdf(toBillingReceiptRecord(row), profile);
    const view = new URL(request.url).searchParams.get("disposition") === "inline";
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${view ? "inline" : "attachment"}; filename="${row.receiptNumber}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError.error !== "Unable to authorize billing action.") {
      return NextResponse.json({ error: authError.error }, { status: authError.status });
    }
    console.error(
      "[api/subscription/invoices/pdf]",
      error instanceof Error ? error.message : "request failed"
    );
    return NextResponse.json({ error: "Unable to download receipt." }, { status: 500 });
  }
}
