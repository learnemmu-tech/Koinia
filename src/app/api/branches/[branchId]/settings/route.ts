import { randomBytes } from "crypto";

import { NextResponse } from "next/server";

import { slugifyChurchSlug } from "@/lib/church-scope";
import { normalizeEnrollmentMode } from "@/lib/enrollment";
import {
  BRANCHES_COLLECTION,
  normalizeBranchFromFirestore,
} from "@/lib/organization/branch-firestore";
import { updateBranch } from "@/lib/organization/organization-server";
import { getMembershipForUser } from "@/lib/organization/organization-server";
import { getAdminDb } from "@/lib/firebase-admin";
import { ENROLLMENT_MODES } from "@/types/enrollment";
import { roleMeetsMinimum } from "@/types/membership";

type RouteContext = { params: Promise<{ branchId: string }> };

type PatchBody = {
  organizationId?: string;
  enrollmentMode?: string;
  joinUrlEnabled?: boolean;
  regenerateSlug?: boolean;
};

async function assertChurchAdmin(
  organizationId: string,
  userId: string
): Promise<void> {
  const membership = await getMembershipForUser(organizationId, userId);
  if (
    !membership ||
    membership.status !== "active" ||
    !roleMeetsMinimum(membership.role, "church_admin")
  ) {
    throw new Error("Forbidden");
  }
}

async function loadBranch(branchId: string) {
  const adminDb = getAdminDb();
  if (!adminDb) throw new Error("Admin database unavailable");

  const snap = await adminDb.collection(BRANCHES_COLLECTION).doc(branchId).get();
  if (!snap.exists) return null;

  return normalizeBranchFromFirestore(
    snap.id,
    snap.data() as Record<string, unknown>
  );
}

async function generateUniqueSlug(baseName: string): Promise<string> {
  const adminDb = getAdminDb();
  if (!adminDb) throw new Error("Admin database unavailable");

  const base = slugifyChurchSlug(baseName);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const suffix = randomBytes(3).toString("hex");
    const candidate = `${base}-${suffix}`;
    const existing = await adminDb
      .collection(BRANCHES_COLLECTION)
      .where("slug", "==", candidate)
      .limit(1)
      .get();
    if (existing.empty) return candidate;
  }

  throw new Error("Unable to generate a unique join link. Please try again.");
}

export async function PATCH(request: Request, context: RouteContext) {
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
    const { branchId } = await context.params;
    const body = (await request.json()) as PatchBody;

    const organizationId = body.organizationId?.trim();
    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    await assertChurchAdmin(organizationId, decoded.uid);

    const branch = await loadBranch(branchId);
    if (!branch || branch.organizationId !== organizationId) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

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
      const oldSlug = branch.slug.trim().toLowerCase();
      updateInput.slug = await generateUniqueSlug(branch.name);
      updateInput.retiredJoinSlugs = [
        ...(branch.retiredJoinSlugs ?? []),
        oldSlug,
      ];
    }

    await updateBranch(branchId, updateInput);

    const updated = await loadBranch(branchId);
    return NextResponse.json({
      slug: updated?.slug ?? branch.slug,
      settings: updated?.settings ?? nextSettings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    const status = message === "Forbidden" ? 403 : 500;
    console.error("[api/branches/settings]", error);
    return NextResponse.json({ error: message }, { status });
  }
}
