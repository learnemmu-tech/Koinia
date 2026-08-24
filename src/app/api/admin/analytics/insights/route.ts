import { NextResponse } from "next/server";

import { verifyAdminAnalyticsRequest } from "@/lib/admin-analytics-auth";
import { loadAdminAnalyticsInsights } from "@/lib/admin-analytics-server";
import { getAdminDb } from "@/lib/firebase-admin";

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

  const adminDb = getAdminDb();
  if (!adminDb) {
    return NextResponse.json(
      {
        error: "Firebase Admin SDK is not configured.",
        code: "ADMIN_SDK_UNAVAILABLE",
        message:
          "Set FIREBASE_SERVICE_ACCOUNT_PATH (path to a service account JSON file) or FIREBASE_SERVICE_ACCOUNT_KEY (inline JSON) in .env. See .env.example for setup. The admin analytics page will fall back to client-side Firestore data where security rules allow.",
      },
      { status: 503 }
    );
  }

  const churchScope = verified.admin.isSuperAdmin
    ? requestedChurchId?.trim() || null
    : verified.admin.churchScope;
  const organizationScope = verified.admin.organizationScope;

  try {
    const insights = await loadAdminAnalyticsInsights(
      adminDb,
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
