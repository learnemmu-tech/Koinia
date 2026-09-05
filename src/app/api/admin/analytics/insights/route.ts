import { NextResponse } from "next/server";
import { verifyAdminAnalyticsRequest } from "@/lib/admin-analytics-auth";
import { loadAdminAnalyticsInsights } from "@/lib/admin-analytics-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedChurchId = searchParams.get("churchId");
  const requestedOrganizationId = searchParams.get("organizationId");

  const verified = await verifyAdminAnalyticsRequest(
    request,
    requestedChurchId,
    requestedOrganizationId
  );

  if (!verified.ok) {
    return NextResponse.json(
      { error: verified.error },
      { status: verified.status }
    );
  }

  const churchScope = verified.admin.isSuperAdmin
    ? requestedChurchId?.trim() || null
    : verified.admin.churchScope;
  const organizationScope = verified.admin.organizationScope;

  try {
    const insights = await loadAdminAnalyticsInsights(
      churchScope,
      organizationScope
    );
    return NextResponse.json(insights);
  } catch (error) {
    console.error("[admin/analytics/insights]", error);
    return NextResponse.json(
      { error: "Unable to load analytics insights." },
      { status: 500 }
    );
  }
}
