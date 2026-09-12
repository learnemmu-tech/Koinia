import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";

import { NextResponse } from "next/server";

import { db } from "@/db";
import { churches } from "@/db/schema";
import { slugifyChurchSlug } from "@/lib/church-scope";
import { normalizeEnrollmentMode } from "@/lib/enrollment";
import { updateBranch } from "@/lib/organization/organization-server";
import { getChurchRowById } from "@/lib/postgres/tenants";
import { virtualBranchFromChurch } from "@/lib/postgres/mappers";
import { userCanManageOrganization } from "@/lib/postgres/session";
import { ENROLLMENT_MODES } from "@/types/enrollment";
import { verifyBearerToken } from "@/lib/email/verify-auth";

type RouteContext = { params: Promise<{ branchId: string }> };

type PatchBody = {
  organizationId?: string;
  enrollmentMode?: string;
  joinUrlEnabled?: boolean;
  regenerateSlug?: boolean;
};

async function assertOrganizationAdmin(
  organizationId: string,
  userId: string
): Promise<void> {
  const allowed = await userCanManageOrganization(userId, organizationId);
  if (!allowed) {
    throw new Error("Forbidden");
  }
}

async function generateUniqueJoinSlug(baseName: string): Promise<string> {
  const base = slugifyChurchSlug(baseName) || "church";
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const suffix = randomBytes(3).toString("hex");
    const candidate = `${base}-${suffix}`;
    const [existing] = await db
      .select({ id: churches.id })
      .from(churches)
      .where(eq(churches.joinSlug, candidate))
      .limit(1);
    if (!existing) return candidate;
  }
  throw new Error("Unable to generate a unique join link. Please try again.");
}

export async function PATCH(request: Request, context: RouteContext) {
  const decoded = await verifyBearerToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { branchId } = await context.params;
    const body = (await request.json()) as PatchBody;

    const organizationId = body.organizationId?.trim();
    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    await assertOrganizationAdmin(organizationId, decoded.uid);

    const church = await getChurchRowById(branchId);
    if (!church || church.organizationId !== organizationId) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const branch = virtualBranchFromChurch(church);
    const currentSettings = branch.settings ?? {};
    const nextSettings = { ...currentSettings };

    if (body.enrollmentMode !== undefined) {
      const mode = String(body.enrollmentMode).trim().toLowerCase();
      if (!ENROLLMENT_MODES.includes(mode as (typeof ENROLLMENT_MODES)[number])) {
        return NextResponse.json(
          { error: "Invalid enrollment mode" },
          { status: 400 }
        );
      }
      nextSettings.enrollmentMode = normalizeEnrollmentMode(mode);
    }

    if (body.joinUrlEnabled !== undefined) {
      nextSettings.joinUrlEnabled = Boolean(body.joinUrlEnabled);
    }

    const updateInput: {
      settings: typeof nextSettings;
      slug?: string;
      retiredJoinSlugs?: string[];
    } = { settings: nextSettings };

    if (body.regenerateSlug) {
      const oldSlug = church.joinSlug.trim().toLowerCase();
      updateInput.slug = await generateUniqueJoinSlug(church.name);
      updateInput.retiredJoinSlugs = [
        ...(church.retiredJoinSlugs ?? []),
        oldSlug,
      ];
    }

    await updateBranch(branchId, updateInput);

    const updated = await getChurchRowById(branchId);
    const mapped = updated ? virtualBranchFromChurch(updated) : branch;
    return NextResponse.json({
      slug: mapped.slug,
      settings: mapped.settings ?? nextSettings,
    });
  } catch (error) {
    console.error("[api/branches/settings]", error);
    const raw = error instanceof Error ? error.message : "";
    if (raw === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}
