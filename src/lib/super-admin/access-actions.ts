"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { organizations } from "@/db/schema";
import { SUPER_ADMIN_BASE } from "@/lib/auth/auth-paths";
import { requirePlatformSuperAdmin } from "@/lib/auth/require-platform-super-admin";
import { isPostgresUuid } from "@/lib/postgres/uuid";

export type SuperAdminOrganizationAccess = "active" | "suspended";

export type SuperAdminOrganizationAccessResult =
  | { ok: true; status: SuperAdminOrganizationAccess }
  | { ok: false; error: string };

async function setOrganizationAccessStatus(
  organizationId: string,
  access: SuperAdminOrganizationAccess
): Promise<SuperAdminOrganizationAccessResult> {
  await requirePlatformSuperAdmin();

  const id = organizationId.trim();
  if (!isPostgresUuid(id)) {
    return { ok: false, error: "Invalid organization." };
  }

  const [existing] = await db
    .select({ id: organizations.id, status: organizations.status })
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1);

  if (!existing) {
    return { ok: false, error: "Organization not found." };
  }

  await db
    .update(organizations)
    .set({
      status: access,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, id));

  revalidatePath(SUPER_ADMIN_BASE);
  revalidatePath(`${SUPER_ADMIN_BASE}/organizations`);
  revalidatePath(`${SUPER_ADMIN_BASE}/organizations/${id}`);

  return { ok: true, status: access };
}

export async function suspendOrganizationAccessAction(
  organizationId: string
): Promise<SuperAdminOrganizationAccessResult> {
  return setOrganizationAccessStatus(organizationId, "suspended");
}

export async function activateOrganizationAccessAction(
  organizationId: string
): Promise<SuperAdminOrganizationAccessResult> {
  return setOrganizationAccessStatus(organizationId, "active");
}
