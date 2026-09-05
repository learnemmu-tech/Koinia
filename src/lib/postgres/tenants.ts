import "server-only";

import { and, desc, eq, or, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  churchMemberships,
  churches,
  organizationMemberships,
  organizations,
  subscriptions,
  users,
} from "@/db/schema";
import { slugifyChurchSlug } from "@/lib/church-scope";
import { isPostgresUuid } from "@/lib/postgres/uuid";
import { DEFAULT_CHURCH_LOGO } from "@/lib/organization/onboarding-constants";
import { resolvePrimaryBranchMembership } from "@/lib/auth/workspace-access";
import {
  getAppUserByClerkId,
  mapAppUserToProfile,
} from "@/lib/postgres/app-user";
import {
  mapChurch,
  mapChurchMembership,
  mapOrganization,
  virtualBranchFromChurch,
} from "@/lib/postgres/mappers";
import {
  getClerkIdByUserId,
  getClerkIdsByUserIds,
  getMembershipForClerkUser,
  getOrgMembershipRow,
  listChurchMembershipsForUser,
  requireAppUserByClerkId,
} from "@/lib/postgres/session";
import type { CreateBranchInput, UpdateBranchInput } from "@/types/branch";
import type { FirebaseBranch } from "@/types/branch";
import type { FirebaseBranchMembership } from "@/types/branch-membership";
import type {
  CreateChurchInput,
  FirebaseChurch,
  UpdateChurchInput,
} from "@/types/firebase-church";
import type { FirebaseMembership } from "@/types/membership";
import type {
  CreateOrganizationInput,
  FirebaseOrganization,
  UpdateOrganizationInput,
} from "@/types/organization";

export type OrganizationSnapshot = {
  organization: FirebaseOrganization;
  membership: FirebaseMembership | null;
  branchMembership: FirebaseBranchMembership | null;
  branchMemberships: FirebaseBranchMembership[];
  churches: FirebaseChurch[];
  branchesByChurch: Record<string, FirebaseBranch[]>;
  userProfile?: {
    activeBranchId?: string;
    churchId?: string;
  };
};

async function uniqueJoinSlug(base: string): Promise<string> {
  const slugBase = slugifyChurchSlug(base) || "church";
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const candidate =
      attempt === 0 ? slugBase : `${slugBase}-${attempt + 1}`;
    const [existing] = await db
      .select({ id: churches.id })
      .from(churches)
      .where(eq(churches.joinSlug, candidate))
      .limit(1);
    if (!existing) return candidate;
  }
  return `${slugBase}-${Date.now().toString(36)}`;
}

export async function getOrganizationById(
  organizationId: string
): Promise<FirebaseOrganization | null> {
  if (!organizationId.trim()) return null;
  const [row] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);
  if (!row) return null;
  const ownerClerkId = (await getClerkIdByUserId(row.ownerId)) ?? row.ownerId;
  return mapOrganization(row, ownerClerkId);
}

export async function getOrganizationsForUser(
  clerkId: string
): Promise<FirebaseOrganization[]> {
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) return [];

  const [orgRows, churchRows] = await Promise.all([
    db
      .select({ organizationId: organizationMemberships.organizationId })
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.userId, appUser.id),
          eq(organizationMemberships.status, "active")
        )
      ),
    db
      .select({ organizationId: churchMemberships.organizationId })
      .from(churchMemberships)
      .where(
        and(
          eq(churchMemberships.userId, appUser.id),
          or(
            eq(churchMemberships.status, "active"),
            eq(churchMemberships.status, "pending")
          )
        )
      ),
  ]);

  const orgIds = [
    ...new Set(
      [...orgRows, ...churchRows]
        .map((row) => row.organizationId)
        .concat(appUser.organizationId ? [appUser.organizationId] : [])
    ),
  ];

  if (orgIds.length === 0) return [];

  const results = await Promise.all(orgIds.map((id) => getOrganizationById(id)));
  return results.filter((org): org is FirebaseOrganization => org !== null);
}

export async function getMembershipForUser(
  organizationId: string,
  clerkId: string
): Promise<FirebaseMembership | null> {
  return getMembershipForClerkUser(organizationId, clerkId);
}

export async function getChurchesByOrganization(
  organizationId: string
): Promise<FirebaseChurch[]> {
  if (!organizationId.trim()) return [];
  const rows = await db
    .select()
    .from(churches)
    .where(eq(churches.organizationId, organizationId));
  return rows.map(mapChurch);
}

export async function getChurchById(
  churchId: string
): Promise<FirebaseChurch | null> {
  const trimmed = churchId.trim();
  if (!isPostgresUuid(trimmed)) return null;
  const [row] = await db
    .select()
    .from(churches)
    .where(eq(churches.id, trimmed))
    .limit(1);
  return row ? mapChurch(row) : null;
}

export async function getChurchRowById(churchId: string) {
  const trimmed = churchId.trim();
  if (!isPostgresUuid(trimmed)) return null;
  const [row] = await db
    .select()
    .from(churches)
    .where(eq(churches.id, trimmed))
    .limit(1);
  return row ?? null;
}

export async function getActiveChurches(): Promise<FirebaseChurch[]> {
  const rows = await db
    .select()
    .from(churches)
    .where(eq(churches.isActive, true))
    .orderBy(churches.name);
  return rows.map(mapChurch);
}

export async function getAllChurches(): Promise<FirebaseChurch[]> {
  const rows = await db.select().from(churches).orderBy(churches.name);
  return rows.map(mapChurch);
}

export async function getChurchBySlug(
  slug: string
): Promise<FirebaseChurch | null> {
  const trimmed = slug.trim().toLowerCase();
  if (!trimmed) return null;
  const [row] = await db
    .select()
    .from(churches)
    .where(or(eq(churches.slug, trimmed), eq(churches.joinSlug, trimmed)))
    .limit(1);
  return row ? mapChurch(row) : null;
}

export async function getChurchIdsForOrganization(
  organizationId: string
): Promise<string[]> {
  const rows = await db
    .select({ id: churches.id })
    .from(churches)
    .where(eq(churches.organizationId, organizationId));
  return rows.map((row) => row.id);
}

export async function getBranchesByChurch(
  organizationId: string,
  churchId: string
): Promise<FirebaseBranch[]> {
  const [row] = await db
    .select()
    .from(churches)
    .where(
      and(
        eq(churches.id, churchId),
        eq(churches.organizationId, organizationId)
      )
    )
    .limit(1);
  return row ? [virtualBranchFromChurch(row)] : [];
}

export async function ensureSubscriptionDocument(organizationId: string) {
  const orgId = organizationId.trim();
  if (!orgId) return null;
  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, orgId))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(subscriptions)
    .values({
      organizationId: orgId,
      planId: "free",
      status: "active",
    })
    .returning();
  return created ?? null;
}

export async function createOrganization(
  input: CreateOrganizationInput
): Promise<string> {
  const owner = await requireAppUserByClerkId(input.ownerId);
  const [organization] = await db
    .insert(organizations)
    .values({
      name: input.name.trim(),
      logoUrl: input.logo?.trim() || DEFAULT_CHURCH_LOGO,
      description: input.description?.trim() || null,
      ownerId: owner.id,
      status: input.status ?? "active",
      workspaceType: input.settings?.workspaceType ?? "independent_church",
      settings: input.settings ?? {},
    })
    .returning({ id: organizations.id });

  if (!organization) {
    throw new Error("Failed to create organization");
  }

  await db.insert(organizationMemberships).values({
    organizationId: organization.id,
    userId: owner.id,
    role: "owner",
    status: "active",
  });

  await db
    .update(users)
    .set({
      organizationId: organization.id,
      updatedAt: new Date(),
    })
    .where(eq(users.id, owner.id));

  await ensureSubscriptionDocument(organization.id);
  return organization.id;
}

export async function updateOrganization(
  organizationId: string,
  input: UpdateOrganizationInput
): Promise<void> {
  const patch: Partial<typeof organizations.$inferInsert> = { updatedAt: new Date() };
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.logo !== undefined) patch.logoUrl = input.logo.trim() || null;
  if (input.description !== undefined) {
    patch.description = input.description.trim() || null;
  }
  if (input.status !== undefined) patch.status = input.status;
  if (input.settings !== undefined) {
    const [existing] = await db
      .select({ settings: organizations.settings, workspaceType: organizations.workspaceType })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);
    patch.settings = { ...(existing?.settings as object), ...input.settings };
    if (input.settings.workspaceType) {
      patch.workspaceType = input.settings.workspaceType;
    }
  }

  await db
    .update(organizations)
    .set(patch)
    .where(eq(organizations.id, organizationId));
}

export async function createChurchInOrganization(
  organizationId: string,
  input: CreateChurchInput,
  creatorClerkId?: string
): Promise<{ churchId: string; branchId: string }> {
  const slug = slugifyChurchSlug(input.slug || input.name) || "church";
  const joinSlug = await uniqueJoinSlug(input.slug || input.name);
  const [church] = await db
    .insert(churches)
    .values({
      organizationId,
      name: input.name.trim(),
      slug,
      joinSlug,
      description: input.description?.trim() || null,
      logoUrl: input.logoUrl?.trim() || input.coverImage?.trim() || DEFAULT_CHURCH_LOGO,
      bannerUrl: input.bannerUrl?.trim() || input.coverImage?.trim() || null,
      address: input.address?.trim() || null,
      city: input.city?.trim() || null,
      state: input.state?.trim() || null,
      country: input.country?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      website: input.website?.trim() || null,
      pastorName: input.pastorName?.trim() || null,
      establishedYear: input.establishedYear ?? null,
      timezone: input.timezone?.trim() || "UTC",
      currency: input.currency?.trim() || "USD",
      denomination: input.denomination?.trim() || null,
      churchType: input.churchType?.trim() || null,
      defaultLanguage: input.settings?.defaultLanguage || "en",
      showDonations: input.settings?.showDonations ?? true,
      showEvents: input.settings?.showEvents ?? true,
      showPrayerWall: input.settings?.showPrayerWall ?? true,
      primaryColor: input.primaryColor?.trim() || null,
      secondaryColor: input.secondaryColor?.trim() || null,
      welcomeMessage: input.welcomeMessage?.trim() || null,
      isActive: input.isActive ?? true,
      enrollmentMode: "approval_required",
      joinUrlEnabled: true,
    })
    .returning({ id: churches.id });

  if (!church) {
    throw new Error("Failed to create church");
  }

  if (creatorClerkId) {
    const creator = await getAppUserByClerkId(creatorClerkId);
    if (creator) {
      await db.insert(churchMemberships).values({
        organizationId,
        churchId: church.id,
        userId: creator.id,
        role: "church_admin",
        status: "active",
      });
    }
  }

  return { churchId: church.id, branchId: church.id };
}

export async function updateChurch(
  churchId: string,
  input: UpdateChurchInput
): Promise<void> {
  const patch: Partial<typeof churches.$inferInsert> = { updatedAt: new Date() };
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.slug !== undefined) patch.slug = slugifyChurchSlug(input.slug) || "church";
  if (input.description !== undefined) patch.description = input.description.trim() || null;
  if (input.logoUrl !== undefined) patch.logoUrl = input.logoUrl.trim() || null;
  if (input.bannerUrl !== undefined) patch.bannerUrl = input.bannerUrl.trim() || null;
  if (input.coverImage !== undefined && input.bannerUrl === undefined) {
    patch.bannerUrl = input.coverImage.trim() || null;
  }
  if (input.address !== undefined) patch.address = input.address.trim() || null;
  if (input.city !== undefined) patch.city = input.city.trim() || null;
  if (input.state !== undefined) patch.state = input.state.trim() || null;
  if (input.country !== undefined) patch.country = input.country.trim() || null;
  if (input.phone !== undefined) patch.phone = input.phone.trim() || null;
  if (input.email !== undefined) patch.email = input.email.trim() || null;
  if (input.website !== undefined) patch.website = input.website.trim() || null;
  if (input.pastorName !== undefined) patch.pastorName = input.pastorName.trim() || null;
  if (input.establishedYear !== undefined) patch.establishedYear = input.establishedYear;
  if (input.timezone !== undefined) patch.timezone = input.timezone.trim() || null;
  if (input.currency !== undefined) patch.currency = input.currency.trim() || null;
  if (input.denomination !== undefined) patch.denomination = input.denomination.trim() || null;
  if (input.churchType !== undefined) patch.churchType = input.churchType.trim() || null;
  if (input.primaryColor !== undefined) patch.primaryColor = input.primaryColor.trim() || null;
  if (input.secondaryColor !== undefined) {
    patch.secondaryColor = input.secondaryColor.trim() || null;
  }
  if (input.welcomeMessage !== undefined) {
    patch.welcomeMessage = input.welcomeMessage.trim() || null;
  }
  if (input.isActive !== undefined) patch.isActive = input.isActive;
  if (input.settings?.defaultLanguage !== undefined) {
    patch.defaultLanguage = input.settings.defaultLanguage;
  }
  if (input.settings?.showDonations !== undefined) {
    patch.showDonations = input.settings.showDonations;
  }
  if (input.settings?.showEvents !== undefined) {
    patch.showEvents = input.settings.showEvents;
  }
  if (input.settings?.showPrayerWall !== undefined) {
    patch.showPrayerWall = input.settings.showPrayerWall;
  }

  await db.update(churches).set(patch).where(eq(churches.id, churchId));
}

export async function deleteChurchInOrganization(
  organizationId: string,
  churchId: string
): Promise<void> {
  const church = await getChurchRowById(churchId);
  if (!church) throw new Error("Church not found");
  if (church.organizationId !== organizationId) {
    throw new Error("Church does not belong to this organization");
  }
  await db.delete(churches).where(eq(churches.id, churchId));
}

export async function createBranch(input: CreateBranchInput): Promise<string> {
  const result = await createChurchInOrganization(input.organizationId, {
    organizationId: input.organizationId,
    name: input.name,
    slug: input.slug || input.name,
    description: input.description,
    address: input.address,
    city: input.city,
    state: input.state,
    country: input.country,
    phone: input.phone,
    email: input.email,
    isActive: input.isActive,
  });
  return result.churchId;
}

export async function updateBranch(
  branchId: string,
  input: UpdateBranchInput
): Promise<void> {
  const churchPatch: UpdateChurchInput = {
    name: input.name,
    slug: input.slug,
    description: input.description,
    address: input.address,
    city: input.city,
    state: input.state,
    country: input.country,
    phone: input.phone,
    email: input.email,
    isActive: input.isActive,
  };
  await updateChurch(branchId, churchPatch);

  const extra: Partial<typeof churches.$inferInsert> = { updatedAt: new Date() };
  let hasExtra = false;
  if (input.settings?.enrollmentMode) {
    extra.enrollmentMode = input.settings.enrollmentMode;
    hasExtra = true;
  }
  if (input.settings?.joinUrlEnabled !== undefined) {
    extra.joinUrlEnabled = input.settings.joinUrlEnabled;
    hasExtra = true;
  }
  if (input.retiredJoinSlugs !== undefined) {
    extra.retiredJoinSlugs = input.retiredJoinSlugs;
    if (input.slug) extra.joinSlug = input.slug;
    hasExtra = true;
  }
  if (hasExtra) {
    await db.update(churches).set(extra).where(eq(churches.id, branchId));
  }
}

export async function deleteBranch(branchId: string): Promise<void> {
  const church = await getChurchRowById(branchId);
  if (!church) throw new Error("Branch not found");
  await db.delete(churches).where(eq(churches.id, branchId));
}

export async function ensureOrganizationForUser(
  clerkId: string,
  defaultName = "My Organization"
): Promise<FirebaseOrganization> {
  const existing = await getOrganizationsForUser(clerkId);
  if (existing[0]) return existing[0];

  const orgId = await createOrganization({
    name: defaultName,
    ownerId: clerkId,
  });
  const org = await getOrganizationById(orgId);
  if (!org) throw new Error("Failed to create organization");
  return org;
}

export async function getOrganizationSnapshot(
  organizationId: string,
  clerkId: string
): Promise<OrganizationSnapshot | null> {
  const [organization, appUser] = await Promise.all([
    getOrganizationById(organizationId),
    getAppUserByClerkId(clerkId),
  ]);
  if (!organization) return null;

  const userProfile = appUser
    ? {
        activeBranchId: appUser.activeChurchId ?? undefined,
        churchId: appUser.activeChurchId ?? undefined,
      }
    : undefined;

  const [membership, churchRows, churchMembershipRows] = await Promise.all([
    getMembershipForClerkUser(organizationId, clerkId),
    db
      .select()
      .from(churches)
      .where(eq(churches.organizationId, organizationId)),
    appUser ? listChurchMembershipsForUser(appUser.id) : Promise.resolve([]),
  ]);

  const churchList = churchRows.map(mapChurch);

  const branchMemberships = churchMembershipRows
    .filter((row) => row.organizationId === organizationId)
    .map((row) => mapChurchMembership(row, clerkId));

  const branchMembership = resolvePrimaryBranchMembership(
    appUser ? mapAppUserToProfile(appUser) : null,
    branchMemberships
  );

  const branchesByChurch: Record<string, FirebaseBranch[]> = {};
  for (const row of churchRows) {
    branchesByChurch[row.id] = [virtualBranchFromChurch(row)];
  }

  return {
    organization,
    membership,
    branchMembership,
    branchMemberships,
    churches: churchList,
    branchesByChurch,
    userProfile,
  };
}

export async function countOrganizationChurches(
  organizationId: string
): Promise<number> {
  const [row] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(churches)
    .where(
      and(
        eq(churches.organizationId, organizationId),
        eq(churches.isActive, true)
      )
    );
  return row?.value ?? 0;
}

export { getOrgMembershipRow };
