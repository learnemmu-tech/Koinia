"use server";

import {
  createChurchInOrganization,
  deleteChurchInOrganization,
  getChurchRowById,
  updateChurch as updateChurchRecord,
} from "@/lib/postgres/tenants";
import type {
  CreateChurchInput,
  UpdateChurchInput,
} from "@/types/firebase-church";

export async function createChurch(input: CreateChurchInput): Promise<string> {
  const organizationId = input.organizationId?.trim();
  if (!organizationId) {
    throw new Error("organizationId is required");
  }
  const created = await createChurchInOrganization(organizationId, input);
  return created.churchId;
}

export async function updateChurch(
  churchId: string,
  input: UpdateChurchInput
): Promise<void> {
  await updateChurchRecord(churchId, input);
}

export async function setChurchActive(
  churchId: string,
  isActive: boolean
): Promise<void> {
  await updateChurchRecord(churchId, { isActive });
}

export async function deleteChurch(churchId: string): Promise<void> {
  const church = await getChurchRowById(churchId);
  if (!church) return;
  await deleteChurchInOrganization(church.organizationId, churchId);
}
