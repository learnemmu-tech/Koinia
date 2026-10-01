"use server";

import { auth } from "@clerk/nextjs/server";

import {
  createChurchInOrganization,
  deleteChurchInOrganization,
  getChurchRowById,
  updateChurch as updateChurchRecord,
} from "@/lib/postgres/tenants";
import {
  assertCanManageChurch,
  userCanManageOrganization,
} from "@/lib/postgres/session";
import type {
  CreateChurchInput,
  UpdateChurchInput,
} from "@/types/firebase-church";

async function requireChurchMutationSession() {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const email =
    typeof sessionClaims?.email === "string" ? sessionClaims.email : undefined;
  return { userId, email };
}

export async function createChurch(input: CreateChurchInput): Promise<string> {
  const session = await requireChurchMutationSession();
  const organizationId = input.organizationId?.trim();
  if (!organizationId) {
    throw new Error("organizationId is required");
  }
  const allowed = await userCanManageOrganization(
    session.userId,
    organizationId
  );
  if (!allowed) {
    throw new Error("Unauthorized");
  }
  const { assertUsageAllowed } = await import(
    "@/lib/subscription/subscription-server"
  );
  await assertUsageAllowed(organizationId, "churches");
  const created = await createChurchInOrganization(organizationId, input);
  return created.churchId;
}

export async function updateChurch(
  churchId: string,
  input: UpdateChurchInput
): Promise<void> {
  const session = await requireChurchMutationSession();
  await assertCanManageChurch(session.userId, session.email, churchId);
  const church = await getChurchRowById(churchId);
  if (church?.organizationId) {
    const { assertSubscriptionWritable } = await import(
      "@/lib/subscription/subscription-server"
    );
    await assertSubscriptionWritable(church.organizationId);
  }
  await updateChurchRecord(churchId, input);
}

export async function setChurchActive(
  churchId: string,
  isActive: boolean
): Promise<void> {
  const session = await requireChurchMutationSession();
  await assertCanManageChurch(session.userId, session.email, churchId);
  const church = await getChurchRowById(churchId);
  if (church?.organizationId) {
    const { assertSubscriptionWritable } = await import(
      "@/lib/subscription/subscription-server"
    );
    await assertSubscriptionWritable(church.organizationId);
  }
  await updateChurchRecord(churchId, { isActive });
}

export async function deleteChurch(churchId: string): Promise<void> {
  const session = await requireChurchMutationSession();
  const church = await getChurchRowById(churchId);
  if (!church) return;
  const allowed = await userCanManageOrganization(
    session.userId,
    church.organizationId
  );
  if (!allowed) {
    throw new Error("Unauthorized");
  }
  const { assertSubscriptionWritable } = await import(
    "@/lib/subscription/subscription-server"
  );
  await assertSubscriptionWritable(church.organizationId);
  await deleteChurchInOrganization(church.organizationId, churchId);
}
