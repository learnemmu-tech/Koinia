import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import type { CreateBranchInput } from "@/types/branch";
import type { CreateChurchInput } from "@/types/firebase-church";
import type { MembershipRole } from "@/types/membership";
import type { WorkspaceType } from "@/types/organization";

import {
  buildChurchCreatePayload,
  CHURCHES_COLLECTION,
} from "@/lib/church-firestore";
import { slugifyChurchSlug } from "@/lib/church-scope";
import { getAdminDb } from "@/lib/firebase-admin";
import { ensureSubscriptionDocument } from "@/lib/subscription/subscription-server";

import {
  buildBranchCreatePayload,
  BRANCHES_COLLECTION,
} from "./branch-firestore";
import {
  buildBranchMembershipCreatePayload,
  BRANCH_MEMBERSHIPS_COLLECTION,
  resolveBranchMembershipDocumentId,
} from "./branch-membership-firestore";
import {
  buildMembershipCreatePayload,
  MEMBERSHIPS_COLLECTION,
  resolveMembershipDocumentId,
} from "./membership-firestore";
import {
  buildOrganizationCreatePayload,
  ORGANIZATIONS_COLLECTION,
} from "./organization-firestore";
import { DEFAULT_BRANCH_NAME, DEFAULT_CHURCH_LOGO } from "./onboarding-constants";
import { getChurchesByOrganization, getOrganizationsForUser, updateOrganization } from "./organization-server";

export type FirstChurchOnboardingInput = {
  name: string;
  country: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  workspaceType: WorkspaceType;
  logoUrl?: string;
  /** @deprecated Optional legacy fields — defaults applied server-side */
  timezone?: string;
  defaultLanguage?: string;
  denomination?: string;
  churchType?: string;
};

export type ProvisionFirstChurchResult = {
  organizationId: string;
  churchId: string;
  branchId: string;
  joinSlug: string;
  skipped: boolean;
};

export type ProvisionOrganizationOnlyResult = {
  organizationId: string;
  skipped: boolean;
};

const DEFAULT_TIMEZONE = "UTC";
const DEFAULT_LANGUAGE = "en";

const PLACEHOLDER_ORG_NAMES = new Set([
  "faithconnecthub",
  "my organization",
]);

function isOnboardingPlaceholderOrg(org: {
  name: string;
  settings?: { workspaceType?: string };
}): boolean {
  const normalizedName = org.name.trim().toLowerCase();
  return (
    !org.settings?.workspaceType ||
    PLACEHOLDER_ORG_NAMES.has(normalizedName)
  );
}

function buildMultiOrgSettings(
  input: Omit<FirstChurchOnboardingInput, "denomination" | "churchType">,
  timezone: string,
  defaultLanguage: string
) {
  return {
    workspaceType: "multi_church_org" as const,
    defaultTimezone: timezone,
    defaultLanguage,
    country: input.country.trim(),
    city: input.city?.trim(),
    state: input.state?.trim(),
    phone: input.phone?.trim(),
    email: input.email?.trim(),
    website: input.website?.trim(),
    address: input.address?.trim(),
  };
}

async function syncUserAfterMultiOrgOnboarding(
  userId: string,
  organizationId: string
): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) throw new Error("Admin database unavailable");

  await adminDb.collection("users").doc(userId).set(
    {
      organizationId,
      needsChurchOnboarding: false,
      onboardingCompletedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

/** Creates the default branch for a church (user-facing: church campus). */
export async function createDefaultBranchForChurch(
  organizationId: string,
  churchId: string,
  options?: { country?: string; name?: string; slug?: string }
): Promise<string> {
  const adminDb = getAdminDb();
  if (!adminDb) throw new Error("Admin database unavailable");

  const branchName = options?.name?.trim() || DEFAULT_BRANCH_NAME;
  const branchSlug = options?.slug?.trim() || slugifyChurchSlug(branchName);

  const input: CreateBranchInput = {
    organizationId,
    churchId,
    name: branchName,
    slug: branchSlug === "main" ? "main" : branchSlug,
    country: options?.country,
    isActive: true,
    isDefault: true,
  };

  const payload = buildBranchCreatePayload(input);
  const branchRef = await adminDb.collection(BRANCHES_COLLECTION).add({
    ...payload,
    isDefault: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await adminDb.collection(CHURCHES_COLLECTION).doc(churchId).update({
    defaultBranchId: branchRef.id,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return branchRef.id;
}

async function createBranchMembershipRecord(
  organizationId: string,
  churchId: string,
  branchId: string,
  userId: string,
  role: MembershipRole
): Promise<void> {
  const adminDb = getAdminDb();
  if (!adminDb) throw new Error("Admin database unavailable");

  const docId = resolveBranchMembershipDocumentId(branchId, userId);
  await adminDb.collection(BRANCH_MEMBERSHIPS_COLLECTION).doc(docId).set({
    ...buildBranchMembershipCreatePayload({
      organizationId,
      churchId,
      branchId,
      userId,
      role,
    }),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Provisions a multi-church organization only (no church/branch yet).
 */
export async function provisionOrganizationOnly(
  userId: string,
  input: Omit<FirstChurchOnboardingInput, "denomination" | "churchType">
): Promise<ProvisionOrganizationOnlyResult> {
  const adminDb = getAdminDb();
  if (!adminDb) throw new Error("Admin database unavailable");

  const existingOrgs = await getOrganizationsForUser(userId);
  if (existingOrgs[0]) {
    const organizationId = existingOrgs[0].id;
    const orgName = input.name.trim();
    const logoUrl = input.logoUrl?.trim() || DEFAULT_CHURCH_LOGO;
    const timezone = input.timezone?.trim() || DEFAULT_TIMEZONE;
    const defaultLanguage = input.defaultLanguage?.trim() || DEFAULT_LANGUAGE;

    if (isOnboardingPlaceholderOrg(existingOrgs[0]) && orgName) {
      await updateOrganization(organizationId, {
        name: orgName,
        logo: logoUrl,
        settings: buildMultiOrgSettings(input, timezone, defaultLanguage),
      });
    }

    await syncUserAfterMultiOrgOnboarding(userId, organizationId);
    return { organizationId, skipped: true };
  }

  const orgName = input.name.trim();
  if (!orgName) throw new Error("Organization name is required");
  if (!input.country?.trim()) throw new Error("Country is required");

  const logoUrl = input.logoUrl?.trim() || DEFAULT_CHURCH_LOGO;
  const timezone = input.timezone?.trim() || DEFAULT_TIMEZONE;
  const defaultLanguage = input.defaultLanguage?.trim() || DEFAULT_LANGUAGE;

  const result = await adminDb.runTransaction(async (transaction) => {
    const orgRef = adminDb.collection(ORGANIZATIONS_COLLECTION).doc();
    const orgMembershipRef = adminDb
      .collection(MEMBERSHIPS_COLLECTION)
      .doc(resolveMembershipDocumentId(orgRef.id, userId));

    const orgPayload = buildOrganizationCreatePayload({
      name: orgName,
      logo: logoUrl,
      ownerId: userId,
      settings: buildMultiOrgSettings(input, timezone, defaultLanguage),
    });

    transaction.set(orgRef, {
      ...orgPayload,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    transaction.set(orgMembershipRef, {
      ...buildMembershipCreatePayload({
        organizationId: orgRef.id,
        userId,
        role: "owner",
      }),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    transaction.set(
      adminDb.collection("users").doc(userId),
      {
        organizationId: orgRef.id,
        needsChurchOnboarding: false,
        onboardingCompletedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { organizationId: orgRef.id };
  });

  await ensureSubscriptionDocument(result.organizationId);

  return { ...result, skipped: false };
}

/**
 * Entry point for workspace onboarding — routes by workspace type.
 */
export async function provisionWorkspaceForUser(
  userId: string,
  input: FirstChurchOnboardingInput
): Promise<ProvisionFirstChurchResult | ProvisionOrganizationOnlyResult> {
  if (input.workspaceType === "multi_church_org") {
    return provisionOrganizationOnly(userId, input);
  }
  return provisionFirstChurchForUser(userId, input);
}

/**
 * Atomically provisions Organization + Church + default branch + memberships
 * for an independent church workspace.
 */
export async function provisionFirstChurchForUser(
  userId: string,
  input: FirstChurchOnboardingInput
): Promise<ProvisionFirstChurchResult> {
  const adminDb = getAdminDb();
  if (!adminDb) throw new Error("Admin database unavailable");

  const existingOrgs = await getOrganizationsForUser(userId);
  if (existingOrgs[0]) {
    const churches = await getChurchesByOrganization(existingOrgs[0].id);
    if (churches[0]) {
      const church = churches[0];
      let branchId = church.defaultBranchId ?? "";
      if (!branchId) {
        const branchSnap = await adminDb
          .collection(BRANCHES_COLLECTION)
          .where("churchId", "==", church.id)
          .where("isDefault", "==", true)
          .limit(1)
          .get();
        branchId = branchSnap.docs[0]?.id ?? "";
      }

      let joinSlug = slugifyChurchSlug(church.name);
      if (branchId) {
        const branchSnap = await adminDb
          .collection(BRANCHES_COLLECTION)
          .doc(branchId)
          .get();
        if (branchSnap.exists) {
          joinSlug = String(branchSnap.data()?.slug ?? joinSlug);
        }
      }

      await adminDb.collection("users").doc(userId).set(
        {
          organizationId: existingOrgs[0].id,
          churchId: church.id,
          activeBranchId: branchId || undefined,
          needsChurchOnboarding: false,
          onboardingCompletedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return {
        organizationId: existingOrgs[0].id,
        churchId: church.id,
        branchId,
        joinSlug,
        skipped: true,
      };
    }
  }

  const churchName = input.name.trim();
  if (!churchName) throw new Error("Organization name is required");
  if (!input.country?.trim()) throw new Error("Country is required");

  const logoUrl = input.logoUrl?.trim() || DEFAULT_CHURCH_LOGO;
  const timezone = input.timezone?.trim() || DEFAULT_TIMEZONE;
  const defaultLanguage = input.defaultLanguage?.trim() || DEFAULT_LANGUAGE;
  const branchSlug = slugifyChurchSlug(churchName);

  const result = await adminDb.runTransaction(async (transaction) => {
    const orgRef = adminDb.collection(ORGANIZATIONS_COLLECTION).doc();
    const churchRef = adminDb.collection(CHURCHES_COLLECTION).doc();
    const branchRef = adminDb.collection(BRANCHES_COLLECTION).doc();
    const orgMembershipRef = adminDb
      .collection(MEMBERSHIPS_COLLECTION)
      .doc(resolveMembershipDocumentId(orgRef.id, userId));
    const branchMembershipRef = adminDb
      .collection(BRANCH_MEMBERSHIPS_COLLECTION)
      .doc(resolveBranchMembershipDocumentId(branchRef.id, userId));

    const orgPayload = buildOrganizationCreatePayload({
      name: churchName,
      logo: logoUrl,
      ownerId: userId,
      settings: {
        workspaceType: "independent_church",
        defaultTimezone: timezone,
        defaultLanguage,
        country: input.country.trim(),
        city: input.city?.trim(),
        state: input.state?.trim(),
        phone: input.phone?.trim(),
        email: input.email?.trim(),
        website: input.website?.trim(),
        address: input.address?.trim(),
      },
    });

    transaction.set(orgRef, {
      ...orgPayload,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const churchPayload = buildChurchCreatePayload({
      name: churchName,
      slug: slugifyChurchSlug(churchName),
      organizationId: orgRef.id,
      logoUrl,
      country: input.country.trim(),
      city: input.city?.trim(),
      state: input.state?.trim(),
      phone: input.phone?.trim(),
      email: input.email?.trim(),
      website: input.website?.trim(),
      address: input.address?.trim(),
      timezone,
      defaultBranchId: branchRef.id,
      settings: { defaultLanguage },
      isActive: true,
    } as CreateChurchInput);

    transaction.set(churchRef, {
      ...churchPayload,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const branchPayload = buildBranchCreatePayload({
      organizationId: orgRef.id,
      churchId: churchRef.id,
      name: churchName,
      slug: branchSlug,
      country: input.country?.trim(),
      isActive: true,
      isDefault: true,
    });

    transaction.set(branchRef, {
      ...branchPayload,
      isDefault: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    transaction.set(orgMembershipRef, {
      ...buildMembershipCreatePayload({
        organizationId: orgRef.id,
        userId,
        role: "owner",
      }),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    transaction.set(branchMembershipRef, {
      ...buildBranchMembershipCreatePayload({
        organizationId: orgRef.id,
        churchId: churchRef.id,
        branchId: branchRef.id,
        userId,
        role: "church_admin",
      }),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    transaction.set(
      adminDb.collection("users").doc(userId),
      {
        organizationId: orgRef.id,
        churchId: churchRef.id,
        activeBranchId: branchRef.id,
        needsChurchOnboarding: false,
        onboardingCompletedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return {
      organizationId: orgRef.id,
      churchId: churchRef.id,
      branchId: branchRef.id,
      joinSlug: branchSlug,
    };
  });

  await ensureSubscriptionDocument(result.organizationId);

  return { ...result, skipped: false };
}

/** When adding a church later (not onboarding), also create Main Branch. */
export async function createChurchWithDefaultBranch(
  organizationId: string,
  input: CreateChurchInput,
  creatorUserId?: string
): Promise<{ churchId: string; branchId: string }> {
  const adminDb = getAdminDb();
  if (!adminDb) throw new Error("Admin database unavailable");

  const payload = buildChurchCreatePayload({
    ...input,
    organizationId,
    logoUrl: input.logoUrl?.trim() || DEFAULT_CHURCH_LOGO,
  });

  const churchRef = await adminDb.collection(CHURCHES_COLLECTION).add({
    ...payload,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const branchId = await createDefaultBranchForChurch(
    organizationId,
    churchRef.id,
    {
      country: input.country,
      name: input.name.trim(),
      slug: slugifyChurchSlug(input.name),
    }
  );

  if (creatorUserId) {
    await createBranchMembershipRecord(
      organizationId,
      churchRef.id,
      branchId,
      creatorUserId,
      "church_admin"
    );

    const userRef = adminDb.collection("users").doc(creatorUserId);
    const userSnap = await userRef.get();
    const userData = userSnap.data() as Record<string, unknown> | undefined;
    if (!userData?.churchId || !userData?.activeBranchId) {
      await userRef.set(
        {
          churchId: churchRef.id,
          activeBranchId: branchId,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
  }

  return { churchId: churchRef.id, branchId };
}
