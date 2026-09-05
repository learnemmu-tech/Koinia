import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  churchMemberships,
  churches,
  organizationMemberships,
  organizations,
  users,
} from "@/db/schema";
import { slugifyChurchSlug } from "@/lib/church-scope";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { DEFAULT_CHURCH_LOGO } from "@/lib/organization/onboarding-constants";
import type { WorkspaceType } from "@/types/organization";

export type PostgresWorkspaceProvisionInput = {
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
};

export type PostgresWorkspaceProvisionResult = {
  organizationId: string;
  churchId?: string;
  joinSlug?: string;
  skipped: boolean;
};

function churchSlugFromName(name: string): string {
  const slug = slugifyChurchSlug(name);
  return slug.length >= 2 ? slug : "church";
}

/**
 * Creates organization/church/memberships and completes onboarding in one
 * PostgreSQL transaction. Does not create branches or Clerk organizations.
 */
export async function provisionWorkspaceInPostgres(
  clerkId: string,
  input: PostgresWorkspaceProvisionInput
): Promise<PostgresWorkspaceProvisionResult> {
  const appUser = await getAppUserByClerkId(clerkId);
  if (!appUser) {
    throw new Error("Application user not found.");
  }

  if (
    appUser.organizationId &&
    appUser.needsChurchOnboarding === false
  ) {
    if (input.workspaceType === "multi_church_org") {
      return {
        organizationId: appUser.organizationId,
        skipped: true,
      };
    }
    if (appUser.activeChurchId) {
      const [existingChurch] = await db
        .select({
          id: churches.id,
          joinSlug: churches.joinSlug,
        })
        .from(churches)
        .where(eq(churches.id, appUser.activeChurchId))
        .limit(1);
      if (existingChurch) {
        return {
          organizationId: appUser.organizationId,
          churchId: existingChurch.id,
          joinSlug: existingChurch.joinSlug,
          skipped: true,
        };
      }
    }
  }

  const workspaceName = input.name.trim();
  const logoUrl = input.logoUrl?.trim() || DEFAULT_CHURCH_LOGO;
  const now = new Date();
  const settings = {
    defaultTimezone: "UTC",
    defaultLanguage: "en",
    country: input.country.trim(),
    city: input.city?.trim() || undefined,
    state: input.state?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    email: input.email?.trim() || undefined,
    website: input.website?.trim() || undefined,
    address: input.address?.trim() || undefined,
  };

  return db.transaction(async (tx) => {
    const latest = await tx
      .select()
      .from(users)
      .where(eq(users.id, appUser.id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!latest) {
      throw new Error("Application user not found.");
    }

    if (
      latest.organizationId &&
      latest.needsChurchOnboarding === false &&
      (input.workspaceType === "multi_church_org" || latest.activeChurchId)
    ) {
      if (input.workspaceType === "multi_church_org") {
        return {
          organizationId: latest.organizationId,
          skipped: true,
        };
      }
      const [existingChurch] = await tx
        .select({
          id: churches.id,
          joinSlug: churches.joinSlug,
        })
        .from(churches)
        .where(eq(churches.id, latest.activeChurchId!))
        .limit(1);
      if (existingChurch) {
        return {
          organizationId: latest.organizationId,
          churchId: existingChurch.id,
          joinSlug: existingChurch.joinSlug,
          skipped: true,
        };
      }
    }

    let organizationId = latest.organizationId;
    if (!organizationId) {
      const [organization] = await tx
        .insert(organizations)
        .values({
          name: workspaceName,
          logoUrl,
          ownerId: latest.id,
          status: "active",
          workspaceType: input.workspaceType,
          settings,
        })
        .returning({ id: organizations.id });

      if (!organization) {
        throw new Error("Failed to create organization.");
      }
      organizationId = organization.id;

      await tx.insert(organizationMemberships).values({
        organizationId,
        userId: latest.id,
        role: "owner",
        status: "active",
      });
    }

    let churchId: string | undefined;
    let joinSlug: string | undefined;

    if (input.workspaceType === "independent_church") {
      if (latest.activeChurchId) {
        const [existingChurch] = await tx
          .select({
            id: churches.id,
            joinSlug: churches.joinSlug,
          })
          .from(churches)
          .where(eq(churches.id, latest.activeChurchId))
          .limit(1);
        churchId = existingChurch?.id;
        joinSlug = existingChurch?.joinSlug;
      }

      if (!churchId) {
        const base = churchSlugFromName(workspaceName);
        let allocatedJoinSlug = `${base}-${Date.now().toString(36)}`;
        for (let attempt = 0; attempt < 25; attempt += 1) {
          const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
          const [existing] = await tx
            .select({ id: churches.id })
            .from(churches)
            .where(eq(churches.joinSlug, candidate))
            .limit(1);
          if (!existing) {
            allocatedJoinSlug = candidate;
            break;
          }
        }
        const slug = churchSlugFromName(workspaceName);
        const [church] = await tx
          .insert(churches)
          .values({
            organizationId,
            name: workspaceName,
            slug,
            joinSlug: allocatedJoinSlug,
            logoUrl,
            country: input.country.trim(),
            city: input.city?.trim() || null,
            state: input.state?.trim() || null,
            phone: input.phone?.trim() || null,
            email: input.email?.trim() || null,
            website: input.website?.trim() || null,
            address: input.address?.trim() || null,
            timezone: "UTC",
            defaultLanguage: "en",
            isActive: true,
            enrollmentMode: "approval_required",
            joinUrlEnabled: true,
          })
          .returning({ id: churches.id, joinSlug: churches.joinSlug });

        if (!church) {
          throw new Error("Failed to create church.");
        }
        churchId = church.id;
        joinSlug = church.joinSlug;

        await tx.insert(churchMemberships).values({
          organizationId,
          churchId,
          userId: latest.id,
          role: "church_admin",
          status: "active",
        });
      }
    }

    await tx
      .update(users)
      .set({
        organizationId,
        activeChurchId: churchId ?? latest.activeChurchId,
        pendingChurchId: null,
        needsChurchOnboarding: false,
        onboardingCompletedAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, latest.id));

    return {
      organizationId,
      churchId,
      joinSlug,
      skipped: false,
    };
  });
}
