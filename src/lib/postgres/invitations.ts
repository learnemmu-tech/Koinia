import "server-only";

import { randomBytes } from "crypto";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  churchMemberships,
  invitations,
  organizationMemberships,
  users,
} from "@/db/schema";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { mapInvitation } from "@/lib/postgres/mappers";
import {
  getClerkIdByUserId,
  getMembershipForClerkUser,
  requireAppUserByClerkId,
} from "@/lib/postgres/session";
import { getChurchRowById } from "@/lib/postgres/tenants";
import type { CreateInvitationInput, FirebaseInvitation } from "@/types/invitation";
import { roleMeetsMinimum, type MembershipRole } from "@/types/membership";

const INVITATION_ROLES = [
  "org_admin",
  "church_admin",
  "leader",
  "editor",
  "member",
  "volunteer",
] as const;

type PgInvitationRole = (typeof INVITATION_ROLES)[number];
type PgChurchRole = "church_admin" | "leader" | "editor" | "member" | "volunteer";

function toPgInvitationRole(role: MembershipRole): PgInvitationRole {
  if (role === "owner" || role === "org_admin") return "org_admin";
  if (role === "branch_admin") return "church_admin";
  if ((INVITATION_ROLES as readonly string[]).includes(role)) {
    return role as PgInvitationRole;
  }
  return "member";
}

function toChurchRole(role: PgInvitationRole): PgChurchRole {
  if (role === "org_admin") return "church_admin";
  return role;
}

function isExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() <= Date.now();
}

async function mapInvitationRow(row: typeof invitations.$inferSelect) {
  const invitedBy = (await getClerkIdByUserId(row.invitedBy)) ?? row.invitedBy;
  const acceptedBy = row.acceptedBy
    ? (await getClerkIdByUserId(row.acceptedBy)) ?? row.acceptedBy
    : null;
  return mapInvitation(row, invitedBy, acceptedBy);
}

export async function createInvitation(
  input: CreateInvitationInput
): Promise<FirebaseInvitation> {
  const inviter = await requireAppUserByClerkId(input.invitedBy);
  const membership = await getMembershipForClerkUser(
    input.organizationId,
    input.invitedBy
  );
  if (
    !membership ||
    membership.status !== "active" ||
    !roleMeetsMinimum(membership.role, "church_admin")
  ) {
    throw new Error("You do not have permission to send invitations");
  }

  const churchId = input.churchId.trim() || input.branchId.trim();
  const church = await getChurchRowById(churchId);
  if (!church || church.organizationId !== input.organizationId) {
    throw new Error("Church not found");
  }

  const expiresInDays = input.expiresInDays ?? 14;
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
  const token = randomBytes(24).toString("hex");

  const [row] = await db
    .insert(invitations)
    .values({
      organizationId: input.organizationId,
      churchId,
      role: toPgInvitationRole(input.role),
      email: input.email?.trim().toLowerCase() || null,
      deliveryMethod: input.deliveryMethod,
      token,
      invitedBy: inviter.id,
      status: "pending",
      expiresAt,
    })
    .returning();

  if (!row) throw new Error("Failed to create invitation");
  return mapInvitationRow(row);
}

export async function getInvitationByToken(
  token: string
): Promise<FirebaseInvitation | null> {
  const trimmed = token.trim();
  if (!trimmed) return null;
  const [row] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.token, trimmed))
    .limit(1);
  if (!row) return null;

  if (row.status === "pending" && isExpired(row.expiresAt)) {
    const [updated] = await db
      .update(invitations)
      .set({ status: "expired", updatedAt: new Date() })
      .where(eq(invitations.id, row.id))
      .returning();
    return mapInvitationRow(updated ?? { ...row, status: "expired" });
  }

  return mapInvitationRow(row);
}

export async function listInvitationsForOrganization(
  organizationId: string
): Promise<FirebaseInvitation[]> {
  const rows = await db
    .select()
    .from(invitations)
    .where(eq(invitations.organizationId, organizationId))
    .orderBy(desc(invitations.createdAt))
    .limit(100);
  return Promise.all(rows.map(mapInvitationRow));
}

export async function revokeInvitation(
  invitationId: string,
  organizationId: string
): Promise<void> {
  const [row] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.id, invitationId))
    .limit(1);
  if (!row) throw new Error("Invitation not found");
  if (row.organizationId !== organizationId) {
    throw new Error("Invitation does not belong to this organization");
  }
  await db
    .update(invitations)
    .set({ status: "revoked", updatedAt: new Date() })
    .where(eq(invitations.id, invitationId));
}

export async function acceptInvitation(
  token: string,
  clerkId: string,
  userEmail?: string | null
): Promise<{ organizationId: string; churchId: string; branchId: string }> {
  const invitation = await getInvitationByToken(token);
  if (!invitation) throw new Error("Invitation not found");
  if (invitation.status !== "pending") {
    throw new Error(`Invitation is ${invitation.status}`);
  }
  if (
    invitation.email &&
    userEmail &&
    invitation.email.toLowerCase() !== userEmail.trim().toLowerCase()
  ) {
    throw new Error("This invitation was sent to a different email address");
  }

  const appUser = await requireAppUserByClerkId(clerkId);
  const pgRole = toPgInvitationRole(invitation.role);

  const existingOrgMemberships = await db
    .select()
    .from(organizationMemberships)
    .where(
      and(
        eq(organizationMemberships.userId, appUser.id),
        eq(organizationMemberships.status, "active")
      )
    );
  const otherOrg = existingOrgMemberships.find(
    (row) => row.organizationId !== invitation.organizationId
  );
  if (otherOrg) {
    throw new Error("You already belong to another organization");
  }

  await db.transaction(async (tx) => {
    if (pgRole === "org_admin") {
      const [existing] = await tx
        .select({ id: organizationMemberships.id })
        .from(organizationMemberships)
        .where(
          and(
            eq(organizationMemberships.organizationId, invitation.organizationId),
            eq(organizationMemberships.userId, appUser.id)
          )
        )
        .limit(1);
      if (!existing) {
        await tx.insert(organizationMemberships).values({
          organizationId: invitation.organizationId,
          userId: appUser.id,
          role: "org_admin",
          status: "active",
        });
      }
    }

    const churchRole = toChurchRole(pgRole);
    const [existingChurch] = await tx
      .select({ id: churchMemberships.id })
      .from(churchMemberships)
      .where(
        and(
          eq(churchMemberships.churchId, invitation.churchId),
          eq(churchMemberships.userId, appUser.id)
        )
      )
      .limit(1);

    if (existingChurch) {
      await tx
        .update(churchMemberships)
        .set({
          role: churchRole,
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(churchMemberships.id, existingChurch.id));
    } else {
      await tx.insert(churchMemberships).values({
        organizationId: invitation.organizationId,
        churchId: invitation.churchId,
        userId: appUser.id,
        role: churchRole,
        status: "active",
      });
    }

    await tx
      .update(invitations)
      .set({
        status: "accepted",
        acceptedAt: new Date(),
        acceptedBy: appUser.id,
        updatedAt: new Date(),
      })
      .where(eq(invitations.token, token.trim()));

    await tx
      .update(users)
      .set({
        organizationId: invitation.organizationId,
        activeChurchId: invitation.churchId,
        pendingChurchId: null,
        needsChurchOnboarding: false,
        onboardingCompletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, appUser.id));
  });

  return {
    organizationId: invitation.organizationId,
    churchId: invitation.churchId,
    branchId: invitation.churchId,
  };
}
