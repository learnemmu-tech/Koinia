"use server";

import type { CreateBranchInput, UpdateBranchInput } from "@/types/branch";
import type { CreateChurchInput, UpdateChurchInput } from "@/types/firebase-church";
import type { UpdateOrganizationInput } from "@/types/organization";

import { updateChurch } from "@/lib/church-mutations";
import { getAppUserByClerkId } from "@/lib/postgres/app-user";
import { getManagedChurchIds } from "@/lib/postgres/session";
import { triggerOrganizationCreatedAdminEmail } from "@/lib/email/triggers";

import {
  canManageChurchInOrganization,
  canManageOrganization,
  type OrganizationAccessUser,
} from "./organization-access";
import { organizationAllowsWorkspaceAccess } from "@/lib/auth/organization-workspace-access-server";
import {
  createBranch,
  createChurchInOrganization,
  deleteBranch,
  deleteChurchInOrganization,
  ensureOrganizationForUser,
  getMembershipForUser,
  getOrganizationsForUser,
  updateBranch,
  updateOrganization,
} from "./organization-server";

async function getAccessUser(
  userId: string,
  email: string | null | undefined,
  organizationId: string
): Promise<OrganizationAccessUser> {
  const appUser = await getAppUserByClerkId(userId);
  const membership = await getMembershipForUser(organizationId, userId);
  const managedChurchIds = appUser
    ? await getManagedChurchIds(appUser.id, organizationId)
    : [];

  return {
    email,
    platformRole: appUser?.platformRole,
    userId,
    membership,
    churchId: appUser?.activeChurchId ?? undefined,
    churchRole: managedChurchIds.length > 0 ? "admin" : "member",
    managedChurchIds,
  };
}

async function assertWorkspaceNotSuspended(
  organizationId: string,
  platformRole: string | null | undefined
): Promise<void> {
  const allowed = await organizationAllowsWorkspaceAccess(
    organizationId,
    platformRole
  );
  if (!allowed) {
    throw new Error("Unauthorized");
  }
}

async function assertOrgAccess(
  userId: string,
  email: string | null | undefined,
  organizationId: string
): Promise<OrganizationAccessUser> {
  const user = await getAccessUser(userId, email, organizationId);
  if (!canManageOrganization(user, organizationId)) {
    throw new Error("Unauthorized");
  }
  await assertWorkspaceNotSuspended(organizationId, user.platformRole);
  return user;
}

export async function ensureUserOrganizationAction(
  userId: string,
  organizationName?: string
): Promise<string> {
  const hadOrganization = (await getOrganizationsForUser(userId)).length > 0;
  const org = await ensureOrganizationForUser(
    userId,
    organizationName ?? "My Organization"
  );

  if (!hadOrganization) {
    const appUser = await getAppUserByClerkId(userId);
    const creatorName =
      `${appUser?.firstName ?? ""} ${appUser?.lastName ?? ""}`.trim() || "—";
    triggerOrganizationCreatedAdminEmail({
      organizationId: org.id,
      organizationName: org.name,
      workspaceType: org.settings?.workspaceType ?? "independent_church",
      creatorName,
      creatorEmail: appUser?.email?.trim() || "—",
    });
  }

  return org.id;
}

export async function updateOrganizationAction(
  organizationId: string,
  userId: string,
  email: string | null | undefined,
  input: UpdateOrganizationInput
): Promise<void> {
  await assertOrgAccess(userId, email, organizationId);
  await updateOrganization(organizationId, input);
}

export async function createChurchInOrganizationAction(
  organizationId: string,
  userId: string,
  email: string | null | undefined,
  input: CreateChurchInput
): Promise<{ churchId: string; branchId: string }> {
  await assertOrgAccess(userId, email, organizationId);
  return createChurchInOrganization(organizationId, input, userId);
}

export async function updateChurchInOrganizationAction(
  organizationId: string,
  churchId: string,
  userId: string,
  email: string | null | undefined,
  input: UpdateChurchInput
): Promise<void> {
  const user = await getAccessUser(userId, email, organizationId);
  await assertWorkspaceNotSuspended(organizationId, user.platformRole);
  if (!canManageChurchInOrganization(user, organizationId, churchId)) {
    throw new Error("Unauthorized");
  }
  await updateChurch(churchId, input);
}

export async function deleteChurchInOrganizationAction(
  organizationId: string,
  churchId: string,
  userId: string,
  email: string | null | undefined
): Promise<void> {
  await assertOrgAccess(userId, email, organizationId);
  await deleteChurchInOrganization(organizationId, churchId);
}

export async function createBranchAction(
  organizationId: string,
  userId: string,
  email: string | null | undefined,
  input: CreateBranchInput
): Promise<string> {
  const user = await getAccessUser(userId, email, organizationId);
  await assertWorkspaceNotSuspended(organizationId, user.platformRole);
  if (!canManageChurchInOrganization(user, organizationId, input.churchId)) {
    throw new Error("Unauthorized");
  }
  return createBranch({ ...input, organizationId });
}

export async function updateBranchAction(
  organizationId: string,
  branchId: string,
  userId: string,
  email: string | null | undefined,
  input: UpdateBranchInput
): Promise<void> {
  await assertOrgAccess(userId, email, organizationId);
  await updateBranch(branchId, input);
}

export async function deleteBranchAction(
  organizationId: string,
  branchId: string,
  userId: string,
  email: string | null | undefined
): Promise<void> {
  await assertOrgAccess(userId, email, organizationId);
  await deleteBranch(branchId);
}
