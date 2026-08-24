import { NextResponse } from "next/server";

import {
  type FirstChurchOnboardingInput,
  provisionWorkspaceForUser,
} from "@/lib/organization/onboarding-server";
import type { WorkspaceType } from "@/types/organization";

type OnboardingWorkspaceBody = FirstChurchOnboardingInput & {
  logoUrl?: string;
};

function isWorkspaceType(value: string): value is WorkspaceType {
  return value === "independent_church" || value === "multi_church_org";
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ?
    authHeader.slice(7)
  : null;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { getAuth } = await import("firebase-admin/auth");
    const decoded = await getAuth().verifyIdToken(token);
    const userId = decoded.uid;

    const body = (await request.json()) as OnboardingWorkspaceBody;
    console.log("[api/onboarding/church] received body:", JSON.stringify(body));

    const name = body.name?.trim();
    const country = body.country?.trim();
    const city = body.city?.trim();
    const state = body.state?.trim();
    const workspaceType = body.workspaceType?.trim() ?? "independent_church";

    if (!name) {
      return NextResponse.json(
        { error: "Church name is required" },
        { status: 400 }
      );
    }
    if (!country) {
      return NextResponse.json({ error: "Country is required" }, { status: 400 });
    }
    if (!city) {
      return NextResponse.json({ error: "City is required" }, { status: 400 });
    }
    if (!state) {
      return NextResponse.json({ error: "State is required" }, { status: 400 });
    }
    if (!isWorkspaceType(workspaceType)) {
      return NextResponse.json(
        { error: "Invalid workspace type" },
        { status: 400 }
      );
    }

    const result = await provisionWorkspaceForUser(userId, {
      name,
      logoUrl: body.logoUrl?.trim() || undefined,
      country,
      city,
      state,
      phone: body.phone?.trim() || undefined,
      email: body.email?.trim() || undefined,
      website: body.website?.trim() || undefined,
      address: body.address?.trim() || undefined,
      workspaceType,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/onboarding/church]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create workspace",
      },
      { status: 500 }
    );
  }
}
